import { useCollections } from '@/utils/hooks/useCollections'
import { useOutstatic } from '@/utils/hooks/useOutstatic'
import {
  SidebarContent,
  SidebarGroup,
  SidebarItem
} from '@outstatic/ui/sidebar'
import { Folder, LayoutDashboard, Plus } from 'lucide-react'
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent
} from '@outstatic/ui/tooltip'
import Link from 'next/link'
import { singular } from 'pluralize'

const CollectionsList = () => {
  const { data: collections } = useCollections()
  const { dashboardRoute } = useOutstatic()

  return (
    <>
      <SidebarContent>
        <SidebarItem
          path={dashboardRoute}
          Icon={<LayoutDashboard className="w-4" />}
        >
          Dashboard
        </SidebarItem>
      </SidebarContent>

      <div className="z-10">
        <Link
          href={`/outstatic/new`}
          className="hidden group-hover:block bg-white p-1 border border-gray-200 text-gray-500 rounded-sm hover:text-gray-700"
          aria-label='Create new item in collection "collection"'
        >
          <Plus strokeWidth={3} size={14} />
        </Link>
      </div>
      <SidebarContent>
        <SidebarGroup key="collections" label="Collections" collapsible={false}>
          {collections
            ? collections.map((collection) => (
                <SidebarItem
                  key={collection.slug}
                  path={`${dashboardRoute}/${collection.slug}`}
                  Icon={<Folder className="w-4" />}
                  action={
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="z-10 w-4">
                            <Link
                              href={`/outstatic/${collection.slug}/new`}
                              className="hidden group-hover:block bg-white p-1 border border-gray-200 text-gray-500 rounded-sm hover:text-gray-700 w-6"
                              aria-label='Create new item in collection "collection"'
                            >
                              <Plus strokeWidth={3} size={14} />
                            </Link>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Create new{' '}
                            <span className="inline-block">
                              {singular(collection.title)}
                            </span>
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  }
                >
                  {collection.title}
                </SidebarItem>
              ))
            : null}
        </SidebarGroup>
      </SidebarContent>
    </>
  )
}

export default CollectionsList
