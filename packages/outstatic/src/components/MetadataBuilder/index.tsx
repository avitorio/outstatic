import {
  DocumentDocument,
  DocumentQuery,
  DocumentQueryVariables,
  GetFileInformationQuery,
  useCreateCommitMutation,
  useGetFileInformationQuery
} from '@/graphql/generated'
import { DeepNonNullable } from '@/types'
import { useApollo } from '@/utils/apollo'
import { chunk } from '@/utils/chunk'
import { createCommitApi } from '@/utils/createCommitApi'
import { hashFromUrl } from '@/utils/hashFromUrl'
import useOid from '@/utils/hooks/useOid'
import useOutstatic from '@/utils/hooks/useOutstatic'
import { stringifyMetadata } from '@/utils/metadata/stringify'
import { MetadataSchema, OutstaticSchema } from '@/utils/metadata/types'
import matter from 'gray-matter'
import MurmurHash3 from 'imurmurhash'
import React, { HTMLAttributes, useEffect, useMemo, useState } from 'react'

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

const isIndexable = (s: string) => {
  return /\.md(x|oc)?$/.test(s)
}

export const MetadataBuilder: React.FC<MetadataBuilderProps> = ({
  rebuild,
  onComplete,
  ...rest
}) => {
  const [total, setTotal] = useState(0)
  const [processed, setProcessed] = useState(0)
  const client = useApollo()
  const fetchOid = useOid()
  const [commit] = useCreateCommitMutation()

  const { repoOwner, repoSlug, repoBranch, contentPath, monorepoPath } =
    useOutstatic()

  const rootPath = [monorepoPath, contentPath].filter(Boolean).join('/')

  const { data } = useGetFileInformationQuery({
    variables: {
      owner: repoOwner,
      name: repoSlug,
      expression: `${repoBranch}:${rootPath}`
    },
    skip: !rebuild
  })

  const files = useMemo(() => {
    // strip object freeze to work with mutable data
    // https://github.com/apollographql/apollo-client/issues/5987#issuecomment-590938556
    const o = JSON.parse(
      JSON.stringify(data?.repository?.object ?? {})
    ) as DeepNonNullable<GetFileInformationQuery>['repository']['object']

    const output: FileData[] = []
    const queue = 'entries' in o ? o.entries ?? [] : []

    while (queue.length > 0) {
      const next = queue.pop()
      if (next?.object?.__typename === 'Tree') {
        // subdir - add entries to queue
        queue.push(...(next.object.entries ?? []))
      } else if (
        next?.object?.__typename === 'Blob' &&
        isIndexable(next.path)
      ) {
        // file - add to output
        output.push({
          path: next.path,
          oid: `${next.object.oid}`,
          commit: hashFromUrl(`${next.object.commitUrl}`)
        })
      }
    }
    // clone out of Apollo's forced read-only
    return output
  }, [data])

  // using useEffect ensures we run a single processing loop
  useEffect(() => {
    const takeAndProcess = async (o: FileData) => {
      const res = await client.query<DocumentQuery, DocumentQueryVariables>({
        query: DocumentDocument,
        variables: {
          owner: repoOwner,
          name: repoSlug,
          filePath: `${repoBranch}:${o.path}`
        }
      })

      if (res.data.repository?.object?.__typename === 'Blob') {
        const m = matter(res.data.repository.object.text ?? '')
        const state = MurmurHash3(res.data.repository.object.text ?? '')
        const fmd: Partial<OutstaticSchema> = {
          ...m.data,
          slug:
            m.data.slug ?? o.path.replace(/^.+\/(.+)\.(md|mdoc|mdx)?/, '$1'),
          __outstatic: {
            commit: o.commit,
            hash: `${state.result()}`,
            path: monorepoPath ? o.path.replace(monorepoPath, '') : o.path
          }
        }
        return fmd
      }

      return undefined
    }

    const fn = async () => {
      setTotal(Math.max(files.length, 1))

      const chunkSize = 5 // TODO move to constants
      const queue = chunk(files, chunkSize)
      const docs: Record<string, unknown>[] = []
      const pendingOid = fetchOid()

      // process in chunks
      while (queue.length > 0) {
        const next = queue.pop()
        if (!next) continue
        const all = Promise.allSettled(
          next.map(async (fd) => {
            const meta = await takeAndProcess(fd)
            docs.push({
              ...meta,
              collection: fd.path
                .replace(rootPath, '') // strip root
                .replace(/^\/+/, '') // strip leading slashes
                .replace(/\/.+$/, '') // strip all after 1st slash
            })
            setProcessed((prev) => prev + 1)
          })
        )
        await all // lets fn() throw on a bad chunk
      }

      // await now that chunks are done in background
      const oid = await pendingOid

      if (docs.length > 0 && oid) {
        const parentHash = hashFromUrl(
          data?.repository?.object?.__typename === 'Tree'
            ? data.repository.object.commitUrl
            : ''
        )
        const db: MetadataSchema = {
          commit: parentHash,
          generated: new Date().toUTCString(),
          metadata: docs.filter(Boolean)
        }
        const capi = createCommitApi({
          message: 'chore: Updates metadata DB',
          owner: repoOwner,
          name: repoSlug,
          branch: repoBranch,
          oid
        })

        capi.replaceFile(
          `${
            monorepoPath ? monorepoPath + '/' : ''
          }${contentPath}/metadata.json`,
          stringifyMetadata(db)
        )
        const payload = capi.createInput()

        try {
          await commit({
            variables: {
              input: payload
            }
          })
        } catch (e) {
          console.error(e)
        }
      }
    }

    fn().catch(console.error)
  }, [
    client,
    data?.repository?.object,
    files,
    repoBranch,
    repoOwner,
    repoSlug,
    rootPath,
    fetchOid,
    contentPath,
    monorepoPath,
    commit
  ])

  useEffect(() => {
    if (processed === total && onComplete) {
      onComplete()
    }
  }, [onComplete, processed, total])

  if (!rebuild) {
    return <div {...rest} />
  }

  return (
    <div {...rest}>
      {processed}&nbsp;/&nbsp;{total}
    </div>
  )
}
