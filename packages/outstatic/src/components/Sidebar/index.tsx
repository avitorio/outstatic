import {
  SidebarContent,
  SidebarGroup,
  SidebarItem,
  Sidebar as SidebarUI
} from '@/components/ui/outstatic/sidebar'
import useOutstatic from '@/utils/hooks/useOutstatic'
import { cn } from '@/utils/ui'
import { Image, LayoutDashboard, Plus, Settings } from 'lucide-react'
import dynamic from 'next/dynamic'
import { SidebarFooter } from './sidebar-footer'
import Link from 'next/link'

const CollectionsList = dynamic(() => import('./CollectionsList'), {
  ssr: false
})

type SidebarProps = {
  isOpen: boolean
}

export const Sidebar = ({ isOpen = false }: SidebarProps) => {
  const { dashboardRoute } = useOutstatic()

  return (
    <div
      className={cn(
        'flex-col justify-between bg-gray-50 dark:bg-background lg:flex z-10',
        isOpen ? 'flex absolute z-10 w-full' : 'hidden'
      )}
      aria-label="Sidebar"
    >
      <SidebarUI className="flex flex-col justify-between">
        <div>
          <CollectionsList />
          <SidebarContent>
            <SidebarGroup key="libraries" label="libraries" collapsible={false}>
              <SidebarItem
                path={`${dashboardRoute}/media-library`}
                Icon={<Image className="w-4" />}
              >
                Media Library
              </SidebarItem>
            </SidebarGroup>
          </SidebarContent>
        </div>
        <div className="flex-col">
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
            <SidebarGroup key="settings" label="settings" collapsible={false}>
              <SidebarItem
                path={dashboardRoute}
                Icon={<LayoutDashboard className="w-4" />}
              >
                Dashboard
              </SidebarItem>
              <SidebarItem
                path={`${dashboardRoute}/settings`}
                Icon={<Settings className="w-4" />}
              >
                Settings
              </SidebarItem>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter />
        </div>
      </SidebarUI>
    </div>
  )
}
