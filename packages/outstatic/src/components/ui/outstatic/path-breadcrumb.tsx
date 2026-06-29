import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/shadcn/breadcrumb'
import { Slash } from 'lucide-react'
import { Fragment } from 'react/jsx-runtime'

function PathBreadcrumbs({ path }: { path: string }) {
  const pathArray = path.split('/')
  const shouldCollapse = pathArray.length > 4
  const visiblePathArray = shouldCollapse ? pathArray.slice(-3) : pathArray

  return (
    <div className="flex items-center p-2 bg-muted rounded-md h-10 overflow-hidden">
      <Breadcrumb>
        <BreadcrumbList className="text-nowrap flex-nowrap">
          {path ? (
            <>
              {shouldCollapse ? (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbEllipsis />
                  </BreadcrumbItem>
                  <BreadcrumbSeparator>
                    <Slash />
                  </BreadcrumbSeparator>
                </>
              ) : null}
              {visiblePathArray.map((folder, index) => (
                <Fragment key={index}>
                  {index > 0 ? (
                    <BreadcrumbSeparator>
                      <Slash />
                    </BreadcrumbSeparator>
                  ) : null}
                  {index !== visiblePathArray.length - 1 ? (
                    <BreadcrumbItem>{folder}</BreadcrumbItem>
                  ) : (
                    <BreadcrumbPage>{folder}</BreadcrumbPage>
                  )}
                </Fragment>
              ))}
            </>
          ) : null}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  )
}

export default PathBreadcrumbs
