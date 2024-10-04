import { AdminLayout, DocumentsTable } from '@/components'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter
} from '@/components/ui/shadcn/card'
import { AdminLoading } from '@/components/AdminLoading'
import { Button } from '@/components/ui/shadcn/button'
import { useGetDocuments } from '@/utils/hooks/useGetDocuments'
import Link from 'next/link'
import { singular } from 'pluralize'
import useOutstatic from '@/utils/hooks/useOutstatic'
import LineBackground from '@/components/ui/outstatic/line-background'
import { sentenceCase } from 'change-case'
import { toast } from 'sonner'

type ListProps = {
  collection: string
}

export default function List({ collection }: ListProps) {
  const { data, isError, isPending } = useGetDocuments()
  const { dashboardRoute } = useOutstatic()

  if (isPending) return <AdminLoading />
  if (isError || data?.documents === null) {
    return (
      <AdminLayout title={sentenceCase(collection)}>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>This collection doesn&apos;t exist.</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You can create a new collection by clicking the button below.</p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link
                href={`${dashboardRoute}/collections/new`}
                className="no-underline"
              >
                Create New Collection
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title={sentenceCase(collection)}>
      <div className="mb-8 flex h-12 items-center capitalize">
        <h1 className="mr-12 text-2xl">{sentenceCase(collection)}</h1>
        <Button asChild>
          <Link href={`${dashboardRoute}/${collection}/new`}>
            New {singular(sentenceCase(collection))}
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
                  {singular(sentenceCase(collection))}
                </span>{' '}
                by clicking the button below.
              </p>

              <Button asChild>
                <Link
                  href={`${dashboardRoute}/${collection}/new`}
                  className="no-underline capitalize"
                >
                  New {singular(sentenceCase(collection))}
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
