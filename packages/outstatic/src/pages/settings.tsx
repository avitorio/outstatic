import React, {
  HTMLAttributes,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import { clsx } from 'clsx'
import { AdminLayout } from '../components'
import { OutstaticContext } from '../context'
import {
  DocumentDocument,
  DocumentQuery,
  DocumentQueryVariables,
  GetFileInformationQuery,
  useGetFileInformationQuery
} from '../graphql/generated'
import { DeepNonNullable } from '../types'
import { useApollo } from '../utils/apollo'
import matter from 'gray-matter'

interface MetadataBuilderProps extends HTMLAttributes<HTMLDivElement> {
  rebuild: boolean
  onComplete?: () => void
}

interface FileData {
  path: string
  oid: string
  commit: string
}

const MetadataBuilder: React.FC<MetadataBuilderProps> = ({
  rebuild,
  onComplete,
  ...rest
}) => {
  const [total, setTotal] = useState(0)
  const [processed, setProcessed] = useState(0)
  const client = useApollo()

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
          commit: `${next.object.commitUrl}`
        })
      }
    }
    return output
  }, [data])

  // using useEffect ensures we run a single processing loop
  useEffect(() => {
    // TODO: concurrent
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
        return m.data
      }

      return undefined
    }

    const fn = async () => {
      setTotal(Math.max(files.length, 1))

      // TODO: Read existing JSON DB off of github if it exists

      const queue = JSON.parse(JSON.stringify(files)) as FileData[]
      const docs: Record<string, unknown>[] = []

      while (queue.length > 0) {
        const next = queue.pop()
        if (next) {
          const meta = await takeAndProcess(next)
          docs.push({
            ...meta,
            category: next.path
              .replace(rootPath, '')
              .replace(/^\/+/, '')
              .replace(/\/.+$/, '')
          })
          setProcessed((prev) => prev + 1)
        }
      }

      // TODO: create JSON db and schedule commit
      if (docs.length > 0) {
        console.log('METADATA EXRACT', docs.filter(Boolean))
      }
    }
    fn().catch(console.error)
  }, [client, files, repoBranch, repoOwner, repoSlug, rootPath])

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

export default function Settings() {
  const [rebuild, setRebuilding] = useState(false)
  const { repoSlug, repoBranch, contentPath } = useContext(OutstaticContext)
  return (
    <AdminLayout title="Settings">
      <div className="mb-8 flex h-12 items-center">
        <h1 className="mr-12 text-2xl">Settings</h1>
      </div>
      <div className="max-w-lg">
        <div className="mb-8 max-w-2xl p-8 px-4 md:p-8 text-black bg-white rounded-lg border border-gray-200 shadow-md prose prose-base">
          <h2>Metadata</h2>
          <div className="flex flex-row items-center">
            <button
              className={clsx(
                'cursor-pointer rounded-lg border px-5 py-2.5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-gray-700 no-underline',
                'text-white',
                'border-gray-600 bg-gray-800',
                rebuild && 'border-gray-400 bg-gray-500'
              )}
              onClick={() => setRebuilding(true)}
            >
              {rebuild ? 'Rebuilding...' : 'Rebuild Metadata'}
            </button>
            <MetadataBuilder
              className="pl-2"
              rebuild={rebuild}
              onComplete={() => setRebuilding(false)}
            />
          </div>
          <p className="text-sm">
            If you&apos;ve made changes outside of outstatic, or if you are
            seeing old posts, you can rebuild your metadata database and
            automatically deploy those changes to your site.
          </p>
        </div>

        <div className="mb-8 max-w-2xl p-8 px-4 md:p-8 text-black bg-white rounded-lg border border-gray-200 shadow-md prose prose-base">
          <h2>Environment</h2>
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900">
              Repository
            </label>
            <input
              className="cursor-not-allowed block p-2 w-full text-gray-900 bg-gray-50 rounded-lg border border-gray-300 sm:text-sm outline-none"
              value={repoSlug}
              readOnly
            />
          </div>
          <div className="mt-4">
            <label className="block mb-2 text-sm font-medium text-gray-900">
              Branch
            </label>
            <input
              className="cursor-not-allowed block p-2 w-full text-gray-900 bg-gray-50 rounded-lg border border-gray-300 sm:text-sm outline-none"
              value={repoBranch}
              readOnly
            />
          </div>
          <div className="mt-4">
            <label className="block mb-2 text-sm font-medium text-gray-900">
              Content Path
            </label>
            <input
              className="cursor-not-allowed block p-2 w-full text-gray-900 bg-gray-50 rounded-lg border border-gray-300 sm:text-sm outline-none"
              value={`${contentPath}`}
              readOnly
            />
          </div>
          <p className="text-sm">
            To learn more about how to update these values,{' '}
            <a
              href="https://outstatic.com/docs/environment-variables"
              target="_blank"
              rel="noreferrer"
              className="underline font-semibold"
            >
              click here
            </a>
            .
          </p>
        </div>
      </div>
    </AdminLayout>
  )
}
