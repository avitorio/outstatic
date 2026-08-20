import { AdminLayout } from '@/components/admin-layout'
import { CardGridSkeleton } from '@/components/skeletons/card-grid-skeleton'
import { DocumentsTableSkeleton } from '@/components/skeletons/documents-table-skeleton'
import { PageHeaderSkeleton } from '@/components/skeletons/page-header-skeleton'

export const DashboardSkeleton = () => (
  <AdminLayout title="Dashboard">
    <div data-testid="admin-loading">
      <PageHeaderSkeleton title="Collections" actions={2} />
      <CardGridSkeleton cards={3} />
      <PageHeaderSkeleton title="Singletons" actions={2} className="mt-8" />
      <div className="relative sm:rounded-lg">
        <DocumentsTableSkeleton rows={3} />
      </div>
    </div>
  </AdminLayout>
)
