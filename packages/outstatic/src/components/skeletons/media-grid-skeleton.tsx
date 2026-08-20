import { Skeleton } from '@/components/ui/shadcn/skeleton'

type MediaGridSkeletonProps = {
  items?: number
}

export const MediaGridSkeleton = ({ items = 12 }: MediaGridSkeletonProps) => (
  <div
    className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8"
    data-testid="media-grid-skeleton"
  >
    {Array.from({ length: items }).map((_, item) => (
      <div key={item} className="space-y-2">
        <Skeleton className="aspect-square w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    ))}
  </div>
)
