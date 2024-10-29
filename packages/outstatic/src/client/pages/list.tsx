import { AdminLayout, DocumentsTable } from '@/components'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from '@/components/ui/shadcn/card'
import { AdminLoading } from '@/components/AdminLoading'
import { Button } from '@/components/ui/shadcn/button'
import { useGetDocuments } from '@/utils/hooks/useGetDocuments'
import Link from 'next/link'
import { singular } from 'pluralize'
import useOutstatic from '@/utils/hooks/useOutstatic'
import LineBackground from '@/components/ui/outstatic/line-background'
import { sentenceCase } from 'change-case'
import { redirect } from 'next/navigation'

type ListProps = {
  collection: string
}

export default function List({ collection }: ListProps) {
  const { data, isError, isPending } = useGetDocuments()
  const { dashboardRoute } = useOutstatic()

  if (isPending) return <AdminLoading />
  if (isError || data?.documents === null) {
    redirect(dashboardRoute)
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
            <Card className="mb-20 max-w-2xl animate-fade-in">
              <CardHeader>
                <CardTitle>This collection has no documents yet.</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col w-full gap-4 prose prose-base">
                <p>
                  Create your first{' '}
                  <span className="capitalize font-semibold">
                    {singular(sentenceCase(collection))}
                  </span>{' '}
                  by clicking the button below.
                </p>

                <div>
                  <Button asChild>
                    <Link
                      href={`${dashboardRoute}/${collection}/new`}
                      className="no-underline capitalize"
                    >
                      New {singular(sentenceCase(collection))}
                    </Link>
                  </Button>
                </div>
                <p className="mt-4">
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
              </CardContent>
            </Card>
          </div>
        </LineBackground>
      )}
    </AdminLayout>
  )
}
