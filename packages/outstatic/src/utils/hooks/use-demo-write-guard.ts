import { useCallback } from 'react'

import { useUpgradeDialog } from '@/components/ui/outstatic/upgrade-dialog-context'

import { useOutstatic } from './use-outstatic'

export class DemoWriteBlockedError extends Error {
  constructor() {
    super('Demo projects are read-only')
    this.name = 'DemoWriteBlockedError'
  }
}

export function useDemoWriteGuard() {
  const { isDemo } = useOutstatic()
  const { openUpgradeDialog } = useUpgradeDialog()

  return useCallback(
    (onBlocked?: () => void) => {
      if (!isDemo) {
        return false
      }

      onBlocked?.()
      openUpgradeDialog(undefined, undefined, 'demo')
      return true
    },
    [isDemo, openUpgradeDialog]
  )
}
