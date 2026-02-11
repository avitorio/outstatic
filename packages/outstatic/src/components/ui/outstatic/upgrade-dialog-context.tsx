'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode
} from 'react'

import { UpgradeDialog } from '@/components/ui/outstatic/upgrade-dialog'
import { useOutstatic } from '@/utils/hooks/useOutstatic'

export type UpgradeDialogHandler = (
  accountSlug?: string,
  dashboardRoute?: string
) => void

type UpgradeDialogContextValue = {
  isUpgradeDialogOpen: boolean
  openUpgradeDialog: UpgradeDialogHandler
  setUpgradeDialogOpen: (open: boolean) => void
}

const UpgradeDialogContext = createContext<UpgradeDialogContextValue | undefined>(
  undefined
)

export function useUpgradeDialog() {
  const context = useContext(UpgradeDialogContext)
  if (context === undefined) {
    throw new Error('useUpgradeDialog must be used within UpgradeDialogProvider')
  }
  return context
}

export function UpgradeDialogProvider({
  children,
  title
}: {
  children: ReactNode
  title?: string
}) {
  const { dashboardRoute, projectInfo } = useOutstatic()
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false)
  const [overrides, setOverrides] = useState<{
    accountSlug?: string
    dashboardRoute?: string
  } | null>(null)

  const openUpgradeDialog = useCallback<UpgradeDialogHandler>(
    (accountSlug, overrideDashboardRoute) => {
      if (accountSlug || overrideDashboardRoute) {
        setOverrides({
          accountSlug,
          dashboardRoute: overrideDashboardRoute
        })
      } else {
        setOverrides(null)
      }
      setIsUpgradeDialogOpen(true)
    },
    []
  )

  const setUpgradeDialogOpen = useCallback((open: boolean) => {
    setIsUpgradeDialogOpen(open)
    if (!open) {
      setOverrides(null)
    }
  }, [])

  const contextValue = useMemo(
    () => ({
      isUpgradeDialogOpen,
      openUpgradeDialog,
      setUpgradeDialogOpen
    }),
    [isUpgradeDialogOpen, openUpgradeDialog, setUpgradeDialogOpen]
  )

  const resolvedAccountSlug = overrides?.accountSlug ?? projectInfo?.accountSlug
  const resolvedDashboardRoute = overrides?.dashboardRoute ?? dashboardRoute

  return (
    <UpgradeDialogContext.Provider value={contextValue}>
      {children}
      <UpgradeDialog
        title={title ?? 'Write faster with AI'}
        open={isUpgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        accountSlug={resolvedAccountSlug}
        dashboardRoute={resolvedDashboardRoute}
      />
    </UpgradeDialogContext.Provider>
  )
}
