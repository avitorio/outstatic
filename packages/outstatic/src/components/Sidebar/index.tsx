import useOutstatic from '@/utils/hooks/useOutstatic'
import dynamic from 'next/dynamic'
import { cn } from '@/utils/ui'
import {
  SidebarContent,
  SidebarGroup,
  SidebarItem,
  Sidebar as SidebarUI
} from '@/components/ui/outstatic/sidebar'
import { Settings } from 'lucide-react'
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
        'flex-col justify-between bg-gray-50 dark:bg-background lg:flex',
        isOpen ? 'flex absolute z-10 w-full' : 'hidden'
      )}
    >
      <SidebarUI className="flex flex-col justify-between">
        <div className="mt-5">
          <CollectionsList />
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
