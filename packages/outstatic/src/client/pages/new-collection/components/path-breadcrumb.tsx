import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'
import { Slash } from 'lucide-react'

function PathBreadcrumbs({ path }: { path: string }) {
  return (
    <div className="flex items-center p-2 bg-gray-50 rounded-md h-10">
      <Breadcrumb>
        <BreadcrumbList>
          {path
            ? path.split('/').map((folder, index) => (
                <>
                  {index > 0 ? (
                    <BreadcrumbSeparator>
                      <Slash />
                    </BreadcrumbSeparator>
                  ) : null}
                  {index !== path.split('/').length - 1 ? (
                    <BreadcrumbItem>{folder}</BreadcrumbItem>
                  ) : (
                    <BreadcrumbPage>{folder}</BreadcrumbPage>
                  )}
                </>
              ))
            : null}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  )
}

export default PathBreadcrumbs
