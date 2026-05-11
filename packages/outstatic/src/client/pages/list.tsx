import { AdminLayout } from '@/components/admin-layout'
import { DocumentsTable } from '@/components/documents-table'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from '@/components/ui/shadcn/card'
import { AdminLoading } from '@/components/admin-loading'
import { Button } from '@/components/ui/shadcn/button'
import { useGetDocuments } from '@/utils/hooks/use-get-documents'
import Link from 'next/link'
import { singular } from 'pluralize'
import { usePermissions } from '@/utils/hooks/use-permissions'
import { useOutstatic } from '@/utils/hooks/use-outstatic'
import LineBackground from '@/components/ui/outstatic/line-background'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/shadcn/tooltip'
import { Settings } from 'lucide-react'

type ListProps = {
  slug: string
  title: string
}

export default function List({ slug, title }: ListProps) {
  const { data, isPending, error } = useGetDocuments()
  const { dashboardRoute } = useOutstatic()
  const { canManageCollections } = usePermissions()

  // Don't show loading screen if we have an error (auth errors will be handled by session refresh)
  if ((isPending || data?.documents === null) && !error) return <AdminLoading />

  return (
    <AdminLayout title={title}>
      <div className="mb-4 flex h-12 items-center">
        <h1 className="mr-4 text-2xl">{title}</h1>
        <div className="flex gap-2 items-center">
          <Button size="sm" asChild>
            <Link href={`${dashboardRoute}/${slug}/new`}>
              New {singular(title)}
            </Link>
          </Button>
          {canManageCollections ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild size="icon" variant="ghost">
                  <Link href={`${dashboardRoute}/collections/${slug}`}>
                    <span className="sr-only">Edit Collection</span>
                    <Settings className="w-6 h-6" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit Collection</p>
              </TooltipContent>
            </Tooltip>
          ) : null}
        </div>
      </div>
      {data?.documents && data.documents.length > 0 && (
        <div className="relative sm:rounded-lg">
          <DocumentsTable key={slug} />
        </div>
      )}
      {data?.documents && data.documents.length === 0 && !isPending && (
        <LineBackground>
          <div className="relative">
            <Card className="mb-20 max-w-2xl animate-fade-in">
              <CardHeader>
                <CardTitle>This collection has no documents yet.</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col w-full gap-4 prose prose-sm dark:prose-invert">
                <p>
                  Create your first{' '}
                  <span className="capitalize font-semibold">
                    {singular(title)}
                  </span>{' '}
                  by clicking the button below.
                </p>

                <div>
                  <Button asChild>
                    <Link
                      href={`${dashboardRoute}/${slug}/new`}
                      className="no-underline capitalize"
                    >
                      New {singular(title)}
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
