import { GET_DOCUMENT } from '@/graphql/queries/document'
import { chunk } from '@/utils/chunk'
import { createCommitApi } from '@/utils/createCommitApi'
import { hashFromUrl } from '@/utils/hashFromUrl'
import { useCreateCommit } from '@/utils/hooks/useCreateCommit'
import { GetDocumentData } from '@/utils/hooks/useGetDocument'
import { useGetFileInformation } from '@/utils/hooks/useGetFileInformation'
import useOid from '@/utils/hooks/useOid'
import useOutstatic from '@/utils/hooks/useOutstatic'
import { stringifyMetadata } from '@/utils/metadata/stringify'
import { MetadataSchema, OutstaticSchema } from '@/utils/metadata/types'
import request from 'graphql-request'
import matter from 'gray-matter'
import MurmurHash3 from 'imurmurhash'
import React, { HTMLAttributes, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

interface MetadataBuilderProps extends HTMLAttributes<HTMLDivElement> {
  rebuild: boolean
  onComplete?: () => void
}

/** Describes the extraction of commit data from the gql query */
interface FileData {
  path: string
  oid: string
  commit: string
}

const isIndexable = (fileName: string) => {
  return /\.md(x|oc)?$/.test(fileName)
}

const getCollectionFromPath = (path: string): string => {
  const parts = path.split('/')
  return parts.length > 1 ? parts[parts.length - 2] : ''
}

export const MetadataBuilder: React.FC<MetadataBuilderProps> = ({
  rebuild,
  onComplete,
  ...rest
}) => {
  const [total, setTotal] = useState(0)
  const [processed, setProcessed] = useState(0)
  const fetchOid = useOid()

  const mutation = useCreateCommit()

  const {
    repoOwner,
    repoSlug,
    repoBranch,
    monorepoPath,
    session,
    ostContent,
    githubGql
  } = useOutstatic()

  const { refetch, data } = useGetFileInformation({ enabled: false })

  useEffect(() => {
    if (rebuild) {
      toast.promise(refetch(), {
        loading: 'Fetching repository files...',
        success: 'Files fetched successfully',
        error: 'Failed to fetch repository files'
      })
    }
  }, [rebuild, refetch])

  const files = useMemo(() => {
    if (!data) return []

    const object = data?.repository?.object
    const output: FileData[] = []
    const queue = object?.entries ? [...object.entries] : []
    while (queue.length > 0) {
      const nextEntry = queue.pop()
      if (nextEntry?.type === 'tree') {
        // subdir - add entries to queue
        queue.push(...(nextEntry.object.entries ?? []))
      } else if (nextEntry?.type === 'blob' && isIndexable(nextEntry.path)) {
        // file - add to output
        output.push({
          path: nextEntry.path,
          oid: `${nextEntry.object.oid}`,
          commit: hashFromUrl(`${nextEntry.object.commitUrl}`)
        })
      }
    }

    if (output.length === 0 && onComplete) {
      onComplete()
    }

    return output
  }, [data])

  // using useEffect ensures we run a single processing loop
  useEffect(() => {
    const takeAndProcess = async (fileData: FileData) => {
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

    const processFiles = async () => {
      setTotal(Math.max(files.length, 1))

      const chunkSize = 5 // TODO move to constants
      const queue = chunk(files, chunkSize)
      const docs: Record<string, unknown>[] = []
      const pendingOid = fetchOid()

      // process in chunks
      while (queue.length > 0) {
        const nextChunk = queue.pop()
        if (!nextChunk) continue
        const all = Promise.allSettled(
          nextChunk.map(async (fileData) => {
            const meta = await takeAndProcess(fileData)
            docs.push({
              ...meta,
              collection: getCollectionFromPath(fileData.path)
            })
            setProcessed((prev) => prev + 1)
          })
        )
        await all // lets processFiles() throw on a bad chunk
      }

      // await now that chunks are done in background
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

        data?.foldersWithoutSchema.forEach((folder) => {
          commitApi.replaceFile(
            `${folder}/schema.json`,
            JSON.stringify(
              {
                title: folder.split('/').pop(),
                type: 'object',
                path: folder,
                properties: {}
              },
              null,
              2
            )
          )
        })

        const payload = commitApi.createInput()

        try {
          mutation.mutate(payload)
        } catch (error) {
          console.error(error)
        }
      }
    }

    if (files.length > 0 && rebuild) {
      toast.promise(processFiles(), {
        loading: 'Processing files...',
        success: 'Files processed successfully',
        error: 'Error processing files'
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files])

  useEffect(() => {
    if (processed === total && onComplete && total > 0 && processed > 0) {
      setTotal(0)
      setProcessed(0)
      onComplete()
    }
  }, [processed, total])

  if (!rebuild) {
    return <div {...rest} />
  }

  return (
    <div {...rest}>
      {processed}&nbsp;/&nbsp;{total}
    </div>
  )
}
