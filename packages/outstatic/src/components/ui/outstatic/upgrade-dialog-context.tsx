'use client'

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode
} from 'react'

import {
  UpgradeDialog,
  type UpgradeFeature
} from '@/components/ui/outstatic/upgrade-dialog'
import { useOutstatic } from '@/utils/hooks/use-outstatic'

export type UpgradeDialogHandler = (
  accountSlug?: string,
  dashboardRoute?: string,
  feature?: UpgradeFeature
) => void

type UpgradeDialogContextValue = {
  isUpgradeDialogOpen: boolean
  openUpgradeDialog: UpgradeDialogHandler
  setUpgradeDialogOpen: (open: boolean) => void
}

const UpgradeDialogContext = createContext<
  UpgradeDialogContextValue | undefined
>(undefined)

export function useUpgradeDialog() {
  const context = useContext(UpgradeDialogContext)
  if (context === undefined) {
    throw new Error(
      'useUpgradeDialog must be used within UpgradeDialogProvider'
    )
  }
  return context
}

export function UpgradeDialogProvider({
  children,
  feature = 'team'
}: {
  children: ReactNode
  feature?: UpgradeFeature
}) {
  const { dashboardRoute, projectInfo } = useOutstatic()
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false)
  const [overrides, setOverrides] = useState<{
    accountSlug?: string
    dashboardRoute?: string
    feature?: UpgradeFeature
  } | null>(null)

  const contextValue = useMemo<UpgradeDialogContextValue>(
    () => ({
      isUpgradeDialogOpen,
      openUpgradeDialog: (
        accountSlug,
        overrideDashboardRoute,
        overrideFeature
      ) => {
        if (accountSlug || overrideDashboardRoute || overrideFeature) {
          setOverrides({
            accountSlug,
            dashboardRoute: overrideDashboardRoute,
            feature: overrideFeature
          })
        } else {
          setOverrides(null)
        }
        setIsUpgradeDialogOpen(true)
      },
      setUpgradeDialogOpen: (open: boolean) => {
        setIsUpgradeDialogOpen(open)
        if (!open) {
          setOverrides(null)
        }
      }
    }),
    [isUpgradeDialogOpen]
  )

  const resolvedAccountSlug = overrides?.accountSlug ?? projectInfo?.accountSlug
  const resolvedDashboardRoute = overrides?.dashboardRoute ?? dashboardRoute
  const resolvedFeature = overrides?.feature ?? feature

  return (
    <UpgradeDialogContext.Provider value={contextValue}>
      {children}
      <UpgradeDialog
        feature={resolvedFeature}
        open={isUpgradeDialogOpen}
        onOpenChange={contextValue.setUpgradeDialogOpen}
        accountSlug={resolvedAccountSlug}
        dashboardRoute={resolvedDashboardRoute}
      />
    </UpgradeDialogContext.Provider>
  )
}
