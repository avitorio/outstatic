import { useOutstatic } from '@/utils/hooks/useOutstatic'
import { z } from 'zod'
import {
  Sidebar as SidebarUI,
  SidebarContent,
  SidebarHeader
} from '@/components/ui/shadcn/sidebar'
import { Settings, Folder, LayoutDashboard, Plus, Images, Users, Key, PlusCircle } from 'lucide-react'
import { SidebarNavigation } from '@/components/ui/outstatic/sidebar'

import { useCollections } from '@/utils/hooks/useCollections'
import { NavigationConfigSchema } from '@/components/ui/outstatic/navigation-config.schema'
import Link from 'next/link'
import { TooltipContent, TooltipTrigger } from '@/components/ui/shadcn/tooltip'
import { TooltipProvider } from '@/components/ui/shadcn/tooltip'
import { Tooltip } from '@/components/ui/shadcn/tooltip'
import { singular } from 'pluralize'
import { Badge } from './ui/shadcn/badge'
import { OUTSTATIC_APP_URL } from '@/utils/constants'
import { UpgradeDialog } from './ui/outstatic/upgrade-dialog'
import { cn } from '@/utils/ui'
import { useCallback } from 'react'
import { AppPermissions } from '@/utils/auth/auth'

type SidebarProps = {
  /** Additional routes to append or replace default settings routes */
  additionalRoutes?: z.infer<typeof NavigationConfigSchema>['routes']
  /** Sidebar style - defaults to 'sidebar' from schema */
  style?: z.infer<typeof NavigationConfigSchema>['style']
  /** Whether the sidebar is collapsed - defaults to true from schema */
  sidebarCollapsed?: z.infer<typeof NavigationConfigSchema>['sidebarCollapsed']
  /** Sidebar collapsed style - defaults to 'icon' from schema */
  sidebarCollapsedStyle?: z.infer<typeof NavigationConfigSchema>['sidebarCollapsedStyle']
}


export const Sidebar = ({
  additionalRoutes,
  style,
  sidebarCollapsed,
  sidebarCollapsedStyle
}: SidebarProps) => {
  const { dashboardRoute, isPro, projectInfo, session } = useOutstatic();
  const { data: collections } = useCollections();
  const userPermissions = session?.user?.permissions;
  const hasPermission = useCallback((permission: AppPermissions) => {
    return userPermissions?.includes(permission) ?? false;
  }, [userPermissions]);


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
                      href={`${dashboardRoute}/${collection.slug}/new`}
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
    ...(additionalRoutes ? additionalRoutes : hasPermission('settings.manage') ? [{
      label: 'Settings',
      children: [
        {
          label: 'Members',
          path: `${dashboardRoute}/redirect?redirectTo=${encodeURIComponent(`${OUTSTATIC_APP_URL}/home/${projectInfo?.accountSlug}/projects/${projectInfo?.projectSlug}/members`)}`,
          newTab: true,
          Icon: <Users className={'w-4'} />,
          badge: isPro ? undefined : <Badge variant="outline"><span className="text-xs font-mono">PRO</span></Badge>,
          dialog: isPro ? undefined :
            <UpgradeDialog accountSlug={projectInfo?.accountSlug} dashboardRoute={dashboardRoute}>
              <div className={cn('flex items-center gap-2 cursor-pointer w-full')}>
                <Users className={'w-4'} />
                Members
              </div>
            </UpgradeDialog>
        },
        {
          label: 'API Keys',
          path: `${dashboardRoute}/redirect?redirectTo=${encodeURIComponent(`${OUTSTATIC_APP_URL}/home/${projectInfo?.accountSlug}/projects/${projectInfo?.projectSlug}/api-keys`)}`,
          newTab: true,
          Icon: <Key className={'w-4'} />,
          badge: isPro ? undefined : <Badge variant="outline">PRO</Badge>,
          dialog: isPro ? undefined :
            <UpgradeDialog title="Unlock API Keys" accountSlug={projectInfo?.accountSlug} dashboardRoute={dashboardRoute}>
              <div className={cn('flex items-center gap-2 cursor-pointer w-full')}>
                <Key className={'w-4'} />
                API Keys
              </div>
            </UpgradeDialog>
        },
        {
          label: 'Settings',
          path: `${dashboardRoute}/settings`,
          Icon: <Settings className={'w-4'} />
        }
      ].filter((route) => !!route)
    }] : []),

  ] satisfies z.infer<typeof NavigationConfigSchema>['routes']

  // Parse config through schema to apply defaults
  const config = NavigationConfigSchema.parse({
    style,
    sidebarCollapsed,
    sidebarCollapsedStyle,
    routes
  })

  return (
    <SidebarUI>
      <SidebarHeader className={'h-16 hidden md:flex'} />
      <SidebarContent>
        <SidebarNavigation config={config} />
      </SidebarContent>
    </SidebarUI>
  )
}
