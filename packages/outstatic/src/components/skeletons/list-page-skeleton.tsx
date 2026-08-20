import { AdminLayout } from '@/components/admin-layout'
import { DocumentsTableSkeleton } from '@/components/skeletons/documents-table-skeleton'
import { PageHeaderSkeleton } from '@/components/skeletons/page-header-skeleton'

type ListPageSkeletonProps = {
  title?: string
  actions?: number
  iconActions?: number
}

export const ListPageSkeleton = ({
  title,
  actions = 1,
  iconActions = 1
}: ListPageSkeletonProps) => (
  <AdminLayout title={title}>
    <div data-testid="admin-loading">
      <PageHeaderSkeleton
        title={title}
        actions={actions}
        iconActions={iconActions}
      />
      <div className="relative sm:rounded-lg">
        <DocumentsTableSkeleton />
      </div>
    </div>
  </AdminLayout>
)
