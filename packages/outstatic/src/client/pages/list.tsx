import { AdminLayout, DocumentsTable } from '@/components'
import { AdminLoading } from '@/components/AdminLoading'
import { Button } from '@/components/ui/button'
import { useGetDocuments } from '@/utils/hooks/useGetDocuments'
import Link from 'next/link'
import { singular } from 'pluralize'
import Collections from './collections'
import useOutstatic from '@/utils/hooks/useOutstatic'

type ListProps = {
  collection: string
}

export default function List({ collection }: ListProps) {
  const { data: documents, isError, isPending } = useGetDocuments()
  const { dashboardRoute } = useOutstatic()

  if (isPending) return <AdminLoading />
  if (isError) return <Collections />

  return (
    <AdminLayout title={collection[0].toUpperCase() + collection.slice(1)}>
      <div className="mb-8 flex h-12 items-center capitalize">
        <h1 className="mr-12 text-2xl">{collection}</h1>
        <Button asChild>
          <Link href={`${dashboardRoute}/${collection}/new`}>
            New {singular(collection)}
          </Link>
        </Button>
      </div>
      {documents.length > 0 && (
        <div className="relative shadow-md sm:rounded-lg">
          <DocumentsTable />
        </div>
      )}
      {documents.length === 0 && !isPending && (
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
              <h3>This collection has no documents yet.</h3>
              <p>
                Create your first{' '}
                <span className="capitalize font-semibold">
                  {singular(collection)}
                </span>{' '}
                by clicking the button below.
              </p>

              <Button asChild>
                <Link
                  href={`${dashboardRoute}/${collection}/new`}
                  className="no-underline capitalize"
                >
                  New {singular(collection)}
                </Link>
              </Button>
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
