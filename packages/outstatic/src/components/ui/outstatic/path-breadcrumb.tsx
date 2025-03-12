import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/shadcn/breadcrumb'
import { Slash } from 'lucide-react'
import { Fragment } from 'react/jsx-runtime'

function PathBreadcrumbs({ path }: { path: string }) {
  const pathArray = path.split('/')
  return (
    <div className="flex items-center p-2 bg-gray-50 rounded-md h-10">
      <Breadcrumb>
        <BreadcrumbList>
          {path
            ? pathArray.map((folder, index) => (
                <Fragment key={index}>
                  {index > 0 ? (
                    <BreadcrumbSeparator>
                      <Slash />
                    </BreadcrumbSeparator>
                  ) : null}
                  {index !== pathArray.length - 1 ? (
                    <BreadcrumbItem>{folder}</BreadcrumbItem>
                  ) : (
                    <BreadcrumbPage>{folder}</BreadcrumbPage>
                  )}
                </Fragment>
              ))
            : null}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  )
}

export default PathBreadcrumbs
