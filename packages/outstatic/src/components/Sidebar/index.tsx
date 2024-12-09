import { useOutstatic } from '@/utils/hooks/useOutstatic'
import dynamic from 'next/dynamic'
import { cn } from '@/utils/ui'
import {
  SidebarContent,
  SidebarGroup,
  SidebarItem,
  Sidebar as SidebarUI
} from '@/components/ui/outstatic/sidebar'
import { Image, Settings } from 'lucide-react'
import { SidebarFooter } from './sidebar-footer'

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
        <div className="mt-5">
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
          <SidebarContent>
            <SidebarGroup key="settings" label="settings" collapsible={false}>
              <SidebarItem
                path={`${dashboardRoute}/settings`}
                Icon={<Settings className="w-4" />}
              >
                Settings
              </SidebarItem>
            </SidebarGroup>
          </SidebarContent>
        </div>
        <SidebarFooter />
      </SidebarUI>
    </div>
  )
}
