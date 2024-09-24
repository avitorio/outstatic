import { AdminLayout, DocumentsTable } from '@/components'
import { AdminLoading } from '@/components/AdminLoading'
import { Button } from '@/components/ui/shadcn/button'
import { useGetDocuments } from '@/utils/hooks/useGetDocuments'
import Link from 'next/link'
import { singular } from 'pluralize'
import Collections from './collections'
import useOutstatic from '@/utils/hooks/useOutstatic'
import LineBackground from '@/components/ui/outstatic/line-background'

type ListProps = {
  collection: string
}

export default function List({ collection }: ListProps) {
  const { data, isError, isPending } = useGetDocuments()
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
      {data?.documents.length > 0 && (
        <div className="relative shadow-md sm:rounded-lg">
          <DocumentsTable />
        </div>
      )}
      {data?.documents.length === 0 && !isPending && (
        <LineBackground>
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
        </LineBackground>
      )}
    </AdminLayout>
  )
}
