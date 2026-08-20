import { AdminLayout } from '@/components/admin-layout'
import { Skeleton } from '@/components/ui/shadcn/skeleton'

const PARAGRAPH_WIDTHS = [
  ['w-full', 'w-full', 'w-11/12', 'w-2/3'],
  ['w-full', 'w-10/12', 'w-full', 'w-1/2'],
  ['w-full', 'w-full', 'w-3/4']
]

const DocumentSettingsSkeleton = () => (
  <aside className="hidden md:block w-full border-l bg-background md:w-64 md:flex-none py-6 h-full max-h-[calc(100vh-128px)] md:max-h-[calc(100vh-56px)] overflow-hidden">
    <div className="relative mb-4 flex w-full items-center justify-between px-4">
      <Skeleton className="h-4 w-10" />
      <Skeleton className="h-9 w-32" />
    </div>
    <div className="relative mb-4 flex w-full items-center justify-between px-4">
      <Skeleton className="h-4 w-12" />
      <Skeleton className="h-9 w-28" />
    </div>
    <div className="flex w-full justify-end px-4 pb-4">
      <Skeleton className="h-9 w-16" />
    </div>
    <div className="w-full border-t">
      {['author', 'slug', 'description', 'content'].map((section) => (
        <div key={section} className="flex h-12 items-center border-b px-4">
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  </aside>
)

const EditorBodySkeleton = () => (
  <div className="m-auto max-w-[700px] space-y-4" data-testid="admin-loading">
    <Skeleton className="h-12 w-3/4" />
    <div className="space-y-8 pt-6">
      {PARAGRAPH_WIDTHS.map((lines, paragraph) => (
        <div key={paragraph} className="space-y-3">
          {lines.map((width, line) => (
            <Skeleton key={line} className={`h-4 ${width}`} />
          ))}
        </div>
      ))}
    </div>
  </div>
)

type EditorPageSkeletonProps = {
  title?: string
  fieldsOnlyMode?: boolean
}

export const EditorPageSkeleton = ({
  title,
  fieldsOnlyMode = false
}: EditorPageSkeletonProps) => {
  if (fieldsOnlyMode) {
    return (
      <AdminLayout title={title} className="p-0 md:p-0 bg-muted">
        <div
          className="block min-h-full w-full max-w-2xl border-r bg-background py-6"
          data-testid="admin-loading"
        >
          <div className="mb-4 w-full space-y-2 px-4">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-9 w-full" />
          </div>
          <div className="mb-4 flex w-full items-center justify-between px-4">
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-9 w-32" />
          </div>
          <div className="mb-4 flex w-full items-center justify-between px-4">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-9 w-28" />
          </div>
          <div className="flex w-full justify-end px-4 pb-4">
            <Skeleton className="h-9 w-16" />
          </div>
          <div className="w-full border-t">
            {['author', 'slug', 'description'].map((section) => (
              <div
                key={section}
                className="flex h-12 items-center border-b px-4"
              >
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title={title} settings={<DocumentSettingsSkeleton />}>
      <EditorBodySkeleton />
    </AdminLayout>
  )
}
