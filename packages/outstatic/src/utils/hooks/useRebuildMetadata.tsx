import { useEffect, useState } from 'react'
import { useCallback } from 'react'
import { toast } from 'sonner'
import { useGetFileInformation } from './useGetFileInformation'
import useOid from './useOid'
import useOutstatic from './useOutstatic'
import { useCreateCommit } from './useCreateCommit'
import { createCommitApi } from '../createCommitApi'
import { hashFromUrl } from '../hashFromUrl'
import { chunk } from '../chunk'
import { stringifyMetadata } from '../metadata/stringify'
import { MetadataSchema, OutstaticSchema } from '../metadata/types'
import { GET_DOCUMENT } from '@/graphql/queries/document'
import { GetDocumentData } from './useGetDocument'
import { CollectionsType } from './useCollections'
import request from 'graphql-request'
import matter from 'gray-matter'
import MurmurHash3 from 'imurmurhash'

interface FileData {
  path: string
  oid: string
  commit: string
}

const isIndexable = (fileName: string) => {
  return /\.md(x|oc)?$/.test(fileName)
}

const getCollectionFromPath = (
  path: string,
  collections: CollectionsType | undefined
): string => {
  const folderPath = path.split('/').slice(0, -1).join('/')
  const matchingCollection = collections?.find(
    (collection) => collection.path === folderPath
  )
  return matchingCollection ? matchingCollection.name : ''
}

export const useRebuildMetadata = () => {
  const [total, setTotal] = useState(0)
  const [processed, setProcessed] = useState(0)
  const fetchOid = useOid()
  const mutation = useCreateCommit()
  const { refetch, data } = useGetFileInformation({ enabled: false })
  const {
    repoOwner,
    repoSlug,
    repoBranch,
    monorepoPath,
    session,
    ostContent,
    githubGql
  } = useOutstatic()

  const toastId = 'metadata-rebuild'

  useEffect(() => {
    if (total >= 1 && processed >= 1) {
      toast.loading(`Processing files: ${processed}/${total}`, {
        id: toastId,
        duration: Infinity
      })
    }
    if (processed === total && total > 0 && processed > 0) {
      toast.dismiss(toastId)
      setTotal(0)
      setProcessed(0)
    }
  }, [processed, total])

  const rebuildMetadata = useCallback(
    async ({
      onComplete
    }: {
      onComplete?: () => void
    } = {}) => {
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
    [refetch]
  )

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

  const getMetaFromFile = async (fileData: FileData) => {
    const filePath = fileData.path.replace(/\.mdx?$/, '')
    const { repository } = await request<GetDocumentData>(
      githubGql,
      GET_DOCUMENT,
      {
        owner: repoOwner || session?.user?.login || '',
        name: repoSlug,
        mdPath: `${repoBranch}:${filePath}.md`,
        mdxPath: `${repoBranch}:${filePath}.mdx`
      },
      {
        authorization: `Bearer ${session?.access_token}`
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
  }

  const processFiles = async (files: FileData[], onComplete?: () => void) => {
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
            collection: getCollectionFromPath(fileData.path, data?.collections)
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
      const database: MetadataSchema = {
        commit: parentHash,
        generated: new Date().toUTCString(),
        metadata: docs.filter(Boolean)
      }
      const commitApi = createCommitApi({
        message: 'chore: Updates metadata DB',
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
        toast.promise(mutation.mutateAsync(payload), {
          loading: 'Updating metadata...',
          success: () => {
            onComplete?.()
            return 'Metadata updated successfully'
          },
          error: 'Failed to update metadata'
        })
      } catch (error) {
        console.error(error)
        throw error
      }
    }
  }

  return rebuildMetadata
}
