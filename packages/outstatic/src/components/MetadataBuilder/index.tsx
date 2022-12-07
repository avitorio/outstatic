import React, {
  HTMLAttributes,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'
import { OutstaticContext } from '../../context'
import {
  DocumentDocument,
  DocumentQuery,
  DocumentQueryVariables,
  GetFileInformationQuery,
  useGetFileInformationQuery
} from '../../graphql/generated'
import { DeepNonNullable } from '../../types'
import { useApollo } from '../../utils/apollo'
import matter from 'gray-matter'
import { chunk } from '../../utils/chunk'
import { hashFromUrl } from '../../utils/hashFromUrl'
import useOid from '../../utils/useOid'
import { createCommit } from '../../utils/createCommit'

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

/** Describes the metadata format */
interface FileMetadata {
  [key: string]: unknown
  __outstatic: {
    path: string
    hash: string
  }
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

  const { repoOwner, repoSlug, repoBranch, contentPath, monorepoPath } =
    useContext(OutstaticContext)

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
      } else if (next?.object?.__typename === 'Blob') {
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
        const fmd: FileMetadata = {
          ...m.data,
          __outstatic: {
            hash: o.commit,
            path: o.path
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
              category: fd.path
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
        const db = {
          hash: parentHash,
          generated: new Date().toUTCString(),
          metadata: docs.filter(Boolean)
        }
        const capi = createCommit({
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
          JSON.stringify(db)
        )
        const payload = capi.createInput()

        // TODO execute commit mutation
        console.log('PAYLOAD', payload)
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
    monorepoPath
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
