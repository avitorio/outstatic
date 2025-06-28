import { useOutstatic } from '@/utils/hooks/useOutstatic'
import { z } from 'zod'
import {
  Sidebar as SidebarUI,
  SidebarContent, SidebarHeader
} from '@/components/ui/shadcn/sidebar'
import { Settings, Folder, LayoutDashboard, Plus, Images } from 'lucide-react'
import { SidebarNavigation } from '../ui/outstatic/sidebar'

import { useCollections } from '@/utils/hooks/useCollections'
import { NavigationConfigSchema } from '../ui/outstatic/navigation-config.schema'
import Link from 'next/link'
import { TooltipContent, TooltipTrigger } from '../ui/shadcn/tooltip'
import { TooltipProvider } from '../ui/shadcn/tooltip'
import { Tooltip } from '../ui/shadcn/tooltip'
import { singular } from 'pluralize'

export const Sidebar = () => {
  const { dashboardRoute } = useOutstatic()
  const { data: collections } = useCollections()

  const routes = [
    {
      label: 'Dashboard',
      children: [
        {
          label: 'Dashboard',
          path: dashboardRoute,
          Icon: <LayoutDashboard className={'w-4'} />,
          end: true
        }
      ]
    },
    ...(collections && collections.length > 0
      ? [
        {
          label: 'Collections',
          collapsible: true,
          children: collections.map((collection) => ({
            label: collection.title,
            path: `${dashboardRoute}/${collection.slug}`,
            Icon: <Folder className={'w-4'} />,
            renderAction: (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href={`/outstatic/${collection.slug}/new`}
                      className="invisible group-hover/menu-item:visible"
                      aria-label={`Create new item in collection ${collection.title}`}
                    >
                      <Plus className="w-3 h-3 pointer-events-none" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent className="pointer-events-none">
                    <p>
                      Create new{' '}
                      <span className="inline-block">
                        {singular(collection.title)}
                      </span>
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          }))
        }
      ]
      : []),
    {
      label: 'Libraries',
      children: [
        {
          label: 'Media Library',
          path: `${dashboardRoute}/media-library`,
          Icon: <Images className={'w-4'} />
        }
      ].filter((route) => !!route)
    },
    {
      label: 'Settings',
      children: [
        {
          label: 'Settings',
          path: `${dashboardRoute}/settings`,
          Icon: <Settings className={'w-4'} />
        }
      ].filter((route) => !!route)
    }
  ] satisfies z.infer<typeof NavigationConfigSchema>['routes']

  return (
      <SidebarUI>
        <SidebarHeader className={'h-16 hidden md:flex'} />
        <SidebarContent>
          <SidebarNavigation config={{ routes }} />
        </SidebarContent>
      </SidebarUI>
  )
}
