import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useGetAllCollectionsFiles } from './use-get-all-collections-files'
import useOid from './use-oid'
import { useOutstatic } from './use-outstatic'
import { useCreateCommit } from './use-create-commit'
import { createCommitApi } from '../create-commit-api'
import { createOutstaticCommitMessage } from '../commit-message'
import { hashFromUrl } from '../hash-from-url'
import { chunk } from '../chunk'
import { stringifyMetadata } from '../metadata/stringify'
import {
  MetadataSchema,
  MetadataType,
  OutstaticSchema
} from '../metadata/types'
import { GET_DOCUMENT } from '@/graphql/queries/document'
import { GetDocumentData } from './use-get-document'
import matter from 'gray-matter'
import MurmurHash3 from 'imurmurhash'
import { useGetFiles } from './use-get-files'
import { useGetMetadata } from './use-get-metadata'

interface FileData {
  path: string
  oid: string
  commit: string
}

const isIndexable = (fileName: string) => {
  return /\.md(x|oc)?$/.test(fileName)
}

export const useRebuildMetadata = ({
  collectionPath
}: {
  collectionPath?: string
} = {}) => {
  const [total, setTotal] = useState(0)
  const [processed, setProcessed] = useState(0)
  const fetchOid = useOid()
  const mutation = useCreateCommit()
  const { refetch: refetchCollections, data } = useGetAllCollectionsFiles({
    enabled: false
  })
  const { refetch: refetchFiles } = useGetFiles({
    enabled: false,
    path: collectionPath
  })
  const { refetch: refetchMetadata } = useGetMetadata({ enabled: false })
  const {
    repoOwner,
    repoSlug,
    repoBranch,
    monorepoPath,
    session,
    ostContent,
    gqlClient
  } = useOutstatic()

  const toastId = 'metadata-rebuild'
  const externalToastIdRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    const activeToastId = externalToastIdRef.current ?? toastId

    if (total >= 1 && processed >= 1) {
      toast.loading(`Processing files: ${processed}/${total}`, {
        id: activeToastId,
        duration: Infinity
      })
    }
    if (processed === total && total > 0 && processed > 0) {
      if (!externalToastIdRef.current) {
        toast.dismiss(toastId)
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTotal(0)
      setProcessed(0)
    }
  }, [processed, total])

  const extractFiles = (data: any): FileData[] => {
    const object = data?.repository?.object
    const output: FileData[] = []
    const queue = object?.entries ? [...object.entries] : []
    while (queue.length > 0) {
      const nextEntry = queue.pop()
      if (nextEntry?.type === 'tree') {
        queue.push(...(nextEntry.object.entries ?? []))
      } else if (nextEntry?.type === 'blob' && isIndexable(nextEntry.path)) {
        output.push({
          path: nextEntry.path,
          oid: `${nextEntry.object.oid}`,
          commit: hashFromUrl(`${nextEntry.object.commitUrl}`)
        })
      }
    }
    return output
  }

  const getMetaFromFile = useCallback(
    async (fileData: FileData) => {
      const filePath = fileData.path.replace(/\.mdx?$/, '')
      const { repository } = await gqlClient.request<GetDocumentData>(
        GET_DOCUMENT,
        {
          owner: repoOwner || session?.user?.login || '',
          name: repoSlug,
          mdPath: `${repoBranch}:${filePath}.md`,
          mdxPath: `${repoBranch}:${filePath}.mdx`
        }
      )

      if (repository?.fileMD || repository?.fileMDX) {
        const text = repository?.fileMD?.text ?? repository?.fileMDX?.text ?? ''
        const parsedMatter = matter(text)
        const state = MurmurHash3(text)
        const fileMetadata: Partial<OutstaticSchema> = {
          ...parsedMatter.data,
          slug:
            parsedMatter.data.slug ??
            fileData.path.replace(/^.+\/(.+)\.(md|mdoc|mdx)?/, '$1'),
          __outstatic: {
            commit: fileData.commit,
            hash: `${state.result()}`,
            path: monorepoPath
              ? fileData.path.replace(monorepoPath, '')
              : fileData.path
          }
        }
        return fileMetadata
      }

      return undefined
    },
    [gqlClient, monorepoPath, repoBranch, repoOwner, repoSlug, session]
  )

  const processFiles = useCallback(
    async (
      files: FileData[],
      onComplete?: () => void,
      options?: { externalToastId?: string }
    ) => {
      setTotal(Math.max(files.length, 1))
      const chunkSize = 5 // TODO move to constants
      const queue = chunk(files, chunkSize)
      const docs: Record<string, unknown>[] = []
      const pendingOid = fetchOid()

      while (queue.length > 0) {
        const nextChunk = queue.pop()
        if (!nextChunk) continue
        const all = Promise.allSettled(
          nextChunk.map(async (fileData) => {
            const meta = await getMetaFromFile(fileData)
            docs.push({
              ...meta,
              collection: fileData.path.split('/').slice(-2, -1)[0]
            })
            setProcessed((prev) => prev + 1)
          })
        )
        await all
      }

      const oid = await pendingOid

      if (docs.length > 0 && oid) {
        const parentHash = hashFromUrl(
          // @ts-ignore
          data?.repository?.object?.commitUrl ?? ''
        )
        let database: MetadataSchema
        if (collectionPath) {
          const { data } = await refetchMetadata()
          // If collectionPath is set, merge with existing metadata
          const existingMetadata =
            data?.metadata?.metadata || ([] as MetadataType)

          database = {
            commit: parentHash,
            generated: new Date().toUTCString(),
            metadata: [...existingMetadata, ...docs.filter(Boolean)]
          }
        } else {
          // Replace entire metadata if no collectionPath
          database = {
            commit: parentHash,
            generated: new Date().toUTCString(),
            metadata: docs.filter(Boolean)
          }
        }
        const commitApi = createCommitApi({
          message: createOutstaticCommitMessage({
            scope: 'config',
            action: 'update',
            target: 'metadata'
          }),
          owner: repoOwner,
          name: repoSlug,
          branch: repoBranch,
          oid
        })

        commitApi.replaceFile(
          `${ostContent}/metadata.json`,
          stringifyMetadata(database)
        )

        const payload = commitApi.createInput()

        try {
          if (options?.externalToastId) {
            toast.loading('Updating metadata...', {
              id: options.externalToastId
            })
            await mutation.mutateAsync(payload)
            onComplete?.()
          } else {
            await toast.promise(mutation.mutateAsync(payload), {
              loading: 'Updating metadata...',
              success: () => {
                onComplete?.()
                return 'Metadata updated successfully'
              },
              error: 'Failed to update metadata'
            })
          }
        } catch (error) {
          console.error(error)
          throw error
        }
      }
    },
    [
      collectionPath,
      data,
      fetchOid,
      getMetaFromFile,
      mutation,
      ostContent,
      refetchMetadata,
      repoBranch,
      repoOwner,
      repoSlug
    ]
  )

  const rebuildMetadata = useCallback(
    async ({
      onComplete,
      toastId: externalToastId
    }: {
      onComplete?: () => void
      toastId?: string
    } = {}) => {
      const refetch = collectionPath ? refetchFiles : refetchCollections

      if (externalToastId) {
        externalToastIdRef.current = externalToastId

        try {
          toast.loading('Fetching repository files...', { id: externalToastId })

          const { data } = await refetch()

          if (!data) {
            throw new Error('No data found')
          }

          const files = extractFiles(data)

          if (files.length === 0) {
            throw new Error('No files found')
          }

          toast.loading('Processing files...', { id: externalToastId })
          await processFiles(files, onComplete, {
            externalToastId
          })
        } finally {
          externalToastIdRef.current = undefined
        }

        return
      }

      return new Promise((resolve, reject) => {
        toast.promise(
          refetch().then(({ data }) => {
            if (!data) {
              console.log('No data found')
              reject('No data found')
              return
            }

            const files = extractFiles(data)
            if (files.length === 0) {
              console.log('No files found')
              reject('No files found')
              return
            }

            return toast.promise(processFiles(files, onComplete), {
              id: toastId,
              duration: 4000,
              loading: `Processing files...`,
              success: 'Files processed successfully',
              error: 'Error processing files'
            })
          }),
          {
            loading: 'Fetching repository files...',
            success: () => {
              resolve(undefined)
              return 'Files fetched successfully'
            },
            error: (err) => {
              reject(err)
              return 'Failed to fetch files'
            }
          }
        )
      })
    },
    [collectionPath, processFiles, refetchCollections, refetchFiles]
  )

  return rebuildMetadata
}
