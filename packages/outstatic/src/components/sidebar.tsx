import { useOutstatic } from '@/utils/hooks/useOutstatic'
import { z } from 'zod/v4'
import {
  Sidebar as SidebarUI,
  SidebarContent,
  SidebarHeader
} from '@/components/ui/shadcn/sidebar'
import {
  Settings,
  Folder,
  LayoutDashboard,
  Plus,
  Images,
  File,
  Key,
  Users
} from 'lucide-react'
import { SidebarNavigation } from '@/components/ui/outstatic/sidebar'

import { useCollections } from '@/utils/hooks/useCollections'
import { useSingletons } from '@/utils/hooks/useSingletons'
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
import { useCallback, useMemo } from 'react'
import { AppPermissions } from '@/utils/auth/auth'
import {
  buildApiKeySignupUrl,
  buildOutstaticCallbackOrigin
} from '@/utils/buildApiKeySignupUrl'
import { useClientOrigin } from '@/utils/hooks/useClientOrigin'

type SidebarProps = {
  /** Additional routes to append or replace default settings routes */
  additionalRoutes?: z.infer<typeof NavigationConfigSchema>['routes']
  /** Sidebar style - defaults to 'sidebar' from schema */
}

export const Sidebar = ({ additionalRoutes }: SidebarProps) => {
  const { dashboardRoute, isPro, projectInfo, session, basePath } =
    useOutstatic()
  const { data: collections } = useCollections()
  const { data: singletons } = useSingletons()
  const userPermissions = session?.user?.permissions
  const clientOrigin = useClientOrigin()

  const hasPermission = useCallback(
    (permission: AppPermissions) => {
      return userPermissions?.includes(permission) ?? false
    },
    [userPermissions]
  )
  const hasCollections = collections && collections.length > 0
  const hasSingletons = singletons && singletons.length > 0
  const hasContentTypes = hasCollections || hasSingletons
  const callbackOrigin = useMemo(() => {
    if (!clientOrigin) {
      return undefined
    }

    return buildOutstaticCallbackOrigin(clientOrigin, basePath)
  }, [basePath, clientOrigin])

  const signUpForApiKeysUrl = useMemo(
    () =>
      buildApiKeySignupUrl({
        callbackOrigin
      }),
    [callbackOrigin]
  )
  const apiKeysRedirectPath =
    projectInfo?.accountSlug && projectInfo?.projectSlug
      ? `${OUTSTATIC_APP_URL}/home/${projectInfo.accountSlug}/${projectInfo.projectSlug}/api-keys`
      : signUpForApiKeysUrl

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
                : []),
              ...(hasSingletons
                ? [
                    {
                      label: 'Singletons',
                      collapsible: true,
                      renderAction: (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link
                                href={`${dashboardRoute}/singletons/new`}
                                className="invisible group-hover/collapsible:visible"
                                aria-label={`Create new singleton`}
                              >
                                <Plus className="w-3 h-3 pointer-events-none" />
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent className="pointer-events-none">
                              <p>
                                Create new{' '}
                                <span className="inline-block">Singleton</span>
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ),
                      children: singletons.map((singleton) => ({
                        label: singleton.title,
                        path: `${dashboardRoute}/singletons/${singleton.slug}`,
                        Icon: <File className={'w-4'} />
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
    ...(additionalRoutes
      ? additionalRoutes
      : hasPermission('settings.manage')
        ? [
            {
              label: 'Settings',
              children: [
                {
                  label: 'Members',
                  path: `${dashboardRoute}/redirect?redirectTo=${encodeURIComponent(`${OUTSTATIC_APP_URL}/home/${projectInfo?.accountSlug}/${projectInfo?.projectSlug}/members`)}`,
                  newTab: true,
                  Icon: <Users className={'w-4'} />,
                  badge: isPro ? undefined : (
                    <Badge variant="outline">
                      <span className="text-xs font-mono">PRO</span>
                    </Badge>
                  ),
                  dialog: isPro ? undefined : (
                    <UpgradeDialog
                      accountSlug={projectInfo?.accountSlug}
                      dashboardRoute={dashboardRoute}
                    >
                      <div
                        className={cn(
                          'flex items-center gap-2 cursor-pointer w-full'
                        )}
                      >
                        <Users className={'w-4'} />
                        Members
                      </div>
                    </UpgradeDialog>
                  )
                },
                {
                  label: 'API Keys',
                  path: `${dashboardRoute}/redirect?redirectTo=${encodeURIComponent(apiKeysRedirectPath)}`,
                  newTab: true,
                  Icon: <Key className={'w-4'} />
                },
                {
                  label: 'Settings',
                  path: `${dashboardRoute}/settings`,
                  Icon: <Settings className={'w-4'} />
                }
              ].filter((route) => !!route)
            }
          ]
        : [])
  ] satisfies z.infer<typeof NavigationConfigSchema>['routes']

  // Parse config through schema to apply defaults
  const config = NavigationConfigSchema.parse({
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
