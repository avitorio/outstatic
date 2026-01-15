import { useOutstatic } from '@/utils/hooks/useOutstatic'
import { z } from 'zod/v4'
import {
  Sidebar as SidebarUI,
  SidebarContent,
  SidebarHeader
} from '@/components/ui/shadcn/sidebar'
import { Settings, Folder, LayoutDashboard, Plus, Images } from 'lucide-react'
import { SidebarNavigation } from '@/components/ui/outstatic/sidebar'

import { useCollections } from '@/utils/hooks/useCollections'
import { NavigationConfigSchema } from '@/components/ui/outstatic/navigation-config.schema'
import Link from 'next/link'
import { TooltipContent, TooltipTrigger } from '@/components/ui/shadcn/tooltip'
import { TooltipProvider } from '@/components/ui/shadcn/tooltip'
import { Tooltip } from '@/components/ui/shadcn/tooltip'
import { singular } from 'pluralize'

export const Sidebar = () => {
  const { dashboardRoute } = useOutstatic()
  const { data: collections } = useCollections()

  const hasCollections = collections && collections.length > 0
  const hasContentTypes = hasCollections

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
    ...(hasContentTypes
      ? [
          {
            label: 'Content',
            collapsible: false,
            children: [
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
                                  href={`${dashboardRoute}/${collection.slug}/new`}
                                  className="invisible group-hover/sub-menu-item:visible"
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
                : [])
            ]
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
      ]
    },
    {
      label: 'Settings',
      children: [
        {
          label: 'Settings',
          path: `${dashboardRoute}/settings`,
          Icon: <Settings className={'w-4'} />
        }
      ]
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
