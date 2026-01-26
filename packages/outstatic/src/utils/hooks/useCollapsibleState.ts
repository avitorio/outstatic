'use client'

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'sidebar_collapsible_state'

type CollapsibleState = Record<string, boolean>

/**
 * Hook to manage collapsible section state with localStorage persistence
 * Similar to how SidebarProvider manages sidebar open state
 */
export function useCollapsibleState() {
  const [state, setState] = useState<CollapsibleState>(() => {
    // Initialize from localStorage on mount
    if (typeof window === 'undefined') {
      return {}
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.warn('Failed to load collapsible state from localStorage:', error)
    }

    return {}
  })

  // Persist to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (error) {
      console.warn('Failed to save collapsible state to localStorage:', error)
    }
  }, [state])

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

