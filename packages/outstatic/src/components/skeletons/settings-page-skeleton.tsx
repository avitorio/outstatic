import { AdminLayout } from '@/components/admin-layout'
import { Card, CardContent, CardHeader } from '@/components/ui/shadcn/card'
import { Skeleton } from '@/components/ui/shadcn/skeleton'
import { PageHeaderSkeleton } from '@/components/skeletons/page-header-skeleton'

export const SettingsPageSkeleton = () => (
  <AdminLayout title="Settings">
    <div data-testid="admin-loading">
      <PageHeaderSkeleton title="Settings" actions={0} />
      <div className="flex max-w-2xl flex-1 flex-col space-y-6">
        {['repository', 'media', 'format'].map((section) => (
          <Card key={section}>
            <CardHeader className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-72" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </AdminLayout>
)
