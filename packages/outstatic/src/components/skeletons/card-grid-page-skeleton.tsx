import { AdminLayout } from '@/components/admin-layout'
import { CardGridSkeleton } from '@/components/skeletons/card-grid-skeleton'
import { PageHeaderSkeleton } from '@/components/skeletons/page-header-skeleton'

type CardGridPageSkeletonProps = {
  title?: string
  actions?: number
  cards?: number
  cardActions?: number
}

export const CardGridPageSkeleton = ({
  title,
  actions = 1,
  cards = 3,
  cardActions = 2
}: CardGridPageSkeletonProps) => (
  <AdminLayout title={title}>
    <div data-testid="admin-loading">
      <PageHeaderSkeleton title={title} actions={actions} />
      <CardGridSkeleton cards={cards} actions={cardActions} />
    </div>
  </AdminLayout>
)
