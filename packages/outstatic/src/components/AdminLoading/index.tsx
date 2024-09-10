import AdminLayout from '@/components/AdminLayout'
import { Skeleton } from '@/components/ui/shadcn/skeleton'

export const AdminLoading = () => (
  <AdminLayout>
    <div className="mb-8 flex h-12 items-center">
      <Skeleton className="w-44 h-8" />
    </div>
    <div className="max-w-5xl w-full grid md:grid-cols-3 gap-6">
      <div className="rounded-xl">
        <Skeleton className="h-24" />
      </div>
      <div className="rounded-xl">
        <Skeleton className="h-24" />
      </div>
      <div className="rounded-xl">
        <Skeleton className="h-24" />
      </div>
    </div>
  </AdminLayout>
)
