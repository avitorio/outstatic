import { Card, CardContent } from '@/components/ui/shadcn/card'
import { Skeleton } from '@/components/ui/shadcn/skeleton'

type CardGridSkeletonProps = {
  cards?: number
  actions?: number
}

export const CardGridSkeleton = ({
  cards = 3,
  actions = 1
}: CardGridSkeletonProps) => (
  <div className="w-full grid md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 mb-12">
    {Array.from({ length: cards }).map((_, card) => (
      <Card key={card}>
        <CardContent className="relative flex justify-between items-center">
          <Skeleton className="h-8 w-40" />
          <div className="flex gap-2">
            {Array.from({ length: actions }).map((_, action) => (
              <Skeleton key={action} className="h-9 w-9" />
            ))}
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
)
