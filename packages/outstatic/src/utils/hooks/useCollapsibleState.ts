'use client'

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'sidebar_collapsible_state'

type CollapsibleState = Record<string, boolean>

/**
 * Hook to manage collapsible section state with localStorage persistence
 * Similar to how SidebarProvider manages sidebar open state
 */
export function useCollapsibleState() {
  // Keep initial client render identical to SSR to avoid hydration mismatch.
  const [state, setState] = useState<CollapsibleState>({})
  const [hasHydratedStorage, setHasHydratedStorage] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setState(JSON.parse(stored))
      }
    } catch (error) {
      console.warn('Failed to load collapsible state from localStorage:', error)
    } finally {
      setHasHydratedStorage(true)
    }
  }, [])

  // Persist to localStorage whenever state changes
  useEffect(() => {
    if (!hasHydratedStorage) {
      return
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (error) {
      console.warn('Failed to save collapsible state to localStorage:', error)
    }
  }, [hasHydratedStorage, state])

  const isOpen = useCallback(
    (key: string): boolean | undefined => {
      // Return undefined if key doesn't exist (not yet persisted)
      // This allows components to use their default/collapsed prop
      if (!(key in state)) {
        return undefined
      }
      return state[key]
    },
    [state]
  )

  const toggle = useCallback(
    (key: string) => {
      setState((prev) => ({
        ...prev,
        [key]: !isOpen(key)
      }))
    },
    [isOpen]
  )

  const setOpen = useCallback((key: string, open: boolean) => {
    setState((prev) => ({
      ...prev,
      [key]: open
    }))
  }, [])

  return {
    isOpen,
    toggle,
    setOpen
  }
}
