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
    <div className="p-2 bg-gray-50 border-md">
      <Breadcrumb>
        <BreadcrumbList>
          {path.split('/').map((folder, index) => (
            <>
              <BreadcrumbSeparator>
                <Slash />
              </BreadcrumbSeparator>
              {index !== path.split('/').length - 1 ? (
                <BreadcrumbItem>{folder}</BreadcrumbItem>
              ) : (
                <BreadcrumbPage>{folder}</BreadcrumbPage>
              )}
            </>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  )
}

export default PathBreadcrumbs
