import { GraphQLError } from 'graphql'
import matter from 'gray-matter'
import Link from 'next/link'
import { singular } from 'pluralize'
import { useContext } from 'react'
import { AdminLayout, DocumentsTable } from '../components'
import { OutstaticContext } from '../context'
import { useDocumentsQuery } from '../graphql/generated'
import { Document } from '../types'
import { useOstSignOut } from '../utils/auth/hooks'

type GQLErrorExtended = GraphQLError & { type: string }

type ListProps = {
  collection: string
}

export default function List({ collection }: ListProps) {
  const {
    repoOwner,
    repoSlug,
    repoBranch,
    contentPath,
    monorepoPath,
    session
  } = useContext(OutstaticContext)
  const { data, error, loading } = useDocumentsQuery({
    variables: {
      owner: repoOwner || session?.user?.login || '',
      name: repoSlug || '',
      contentPath:
        `${repoBranch}:${
          monorepoPath ? monorepoPath + '/' : ''
        }${contentPath}/${collection}` || ''
    },
    fetchPolicy: 'network-only',
    onError: ({ graphQLErrors }) => {
      if (
        graphQLErrors &&
        (graphQLErrors?.[0] as GQLErrorExtended)?.type === 'NOT_FOUND'
      ) {
        useOstSignOut()
        return null
      }
      return null
    }
  })

  let documents: Document[] = []

  const entries =
    data?.repository?.object?.__typename === 'Tree' &&
    data?.repository?.object?.entries

  if (entries) {
    entries.forEach((document) => {
      if (document.name.slice(-3) === '.md') {
        const {
          data: { title, publishedAt, status, author }
        } = matter(
          document?.object?.__typename === 'Blob' && document?.object?.text
            ? document?.object?.text
            : ''
        )
        documents.push({
          title,
          status,
          publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
          slug: document.name.replace('.md', ''),
          author,
          content: ''
        })
      }
    })

    documents.sort((a, b) => Number(b.publishedAt) - Number(a.publishedAt))
  }

  return (
    <AdminLayout
      error={error}
      title={collection[0].toUpperCase() + collection.slice(1)}
    >
      <div className="mb-8 flex h-12 items-center">
        <h1 className="mr-12 text-2xl capitalize">{collection}</h1>
        <Link href={`/outstatic/${collection}/new`}>
          <div className="cursor-pointer rounded-lg border px-5 py-2.5 text-sm font-medium focus:outline-none focus:ring-4 border-gray-600 bg-gray-800 text-white hover:border-gray-600 hover:bg-gray-700 focus:ring-gray-700 capitalize">
            New {singular(collection)}
          </div>
        </Link>
      </div>
      {documents.length > 0 && (
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
          <DocumentsTable documents={documents} collection={collection} />
        </div>
      )}
      {documents.length === 0 && !loading && (
        <div className="max-w-2xl">
          <div className="absolute bottom-0 left-0 md:left-64 right-0 md:top-36">
            <svg
              fill="none"
              className="h-full w-full"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="m1555.43 194.147c-100.14 46.518-204.72 78.763-313.64 96.841-78.16 12.972-282.29 0-291.79-143.988-1.58-23.948 1-89.4705 67-127 58-32.9805 115.15-13.36095 142.5 5.5 27.35 18.861 45.02 44.5 54 73 16.37 51.951-9.22 115.124-30.65 161.874-57.09 124.562-177.31 219.357-311.976 246.789-142.617 29.052-292.036-9.369-430.683-41.444-100.166-23.173-196.003-36.724-298.229-15.203-48.046 10.115-94.9295 24.91-139.962 44.112"
                className="stroke-slate-900"
                strokeWidth="2"
              />
            </svg>
          </div>
          <div className="relative">
            <div className="mb-20 max-w-2xl p-8 px-4 md:p-8 text-black bg-white rounded-lg border border-gray-200 shadow-md prose prose-base">
              <p>This collection has no documents yet.</p>
              <p>
                Create your first{' '}
                <span className="capitalize">{singular(collection)}</span> by
                clicking the button below.
              </p>

              <Link href={`/outstatic/${collection}/new`}>
                <div className="inline-block cursor-pointer rounded-lg border px-5 py-2.5 text-sm font-medium focus:outline-none focus:ring-4 border-gray-600 bg-gray-800 text-white hover:border-gray-600 hover:bg-gray-700 focus:ring-gray-700 capitalize">
                  New {singular(collection)}
                </div>
              </Link>
              <p>
                To learn more about how documents work{' '}
                <a
                  href="https://outstatic.com/docs/introduction#whats-a-document"
                  target="_blank"
                  rel="noreferrer"
                >
                  click here
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
