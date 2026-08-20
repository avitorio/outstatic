import { Skeleton } from '@/components/ui/shadcn/skeleton'
import { cn } from '@/utils/ui'

type PageHeaderSkeletonProps = {
  title?: string
  actions?: number
  iconActions?: number
  className?: string
}

export const PageHeaderSkeleton = ({
  title,
  actions = 1,
  iconActions = 0,
  className
}: PageHeaderSkeletonProps) => (
  <div className={cn('mb-4 flex h-12 items-center gap-2', className)}>
    {title ? (
      <h1 className="mr-2 text-2xl text-foreground">{title}</h1>
    ) : (
      <Skeleton className="mr-2 h-8 w-44" />
    )}
    {Array.from({ length: actions }).map((_, index) => (
      <Skeleton key={`action-${index}`} className="h-9 w-24" />
    ))}
    {Array.from({ length: iconActions }).map((_, index) => (
      <Skeleton key={`icon-action-${index}`} className="h-9 w-9" />
    ))}
  </div>
)
