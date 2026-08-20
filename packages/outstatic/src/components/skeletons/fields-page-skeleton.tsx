import { AdminLayout } from '@/components/admin-layout'
import { Card, CardContent } from '@/components/ui/shadcn/card'
import { Skeleton } from '@/components/ui/shadcn/skeleton'

type FieldsPageSkeletonProps = {
  title?: string
  fields?: number
}

export const FieldsPageSkeleton = ({
  title,
  fields = 3
}: FieldsPageSkeletonProps) => (
  <AdminLayout title={title}>
    <div data-testid="admin-loading">
      <div className="mb-4 flex h-12 items-center">
        <Skeleton className="h-8 w-56" />
      </div>
      <div className="flex flex-1 flex-col space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="max-w-5xl w-full grid grid-cols-3 gap-6">
          {Array.from({ length: fields }).map((_, field) => (
            <Card key={field}>
              <CardContent className="relative flex max-w-sm items-center justify-between gap-2 pl-2">
                <Skeleton className="h-9 w-9" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-9 w-9" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  </AdminLayout>
)
