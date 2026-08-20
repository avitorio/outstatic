import { AdminLayout } from '@/components/admin-layout'
import { MediaGridSkeleton } from '@/components/skeletons/media-grid-skeleton'
import { Skeleton } from '@/components/ui/shadcn/skeleton'

export const MediaLibraryPageSkeleton = () => (
  <AdminLayout title="Media Library" className="pt-0 md:pt-0">
    <div data-testid="admin-loading">
      <div className="sticky top-0 z-10 bg-background pb-6 pt-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-xl md:text-2xl">Media Library</h1>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-36" />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Skeleton className="h-9 w-full max-w-sm" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
      <MediaGridSkeleton />
    </div>
  </AdminLayout>
)
