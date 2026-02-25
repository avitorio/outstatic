import {
  createElement,
  createContext,
  type Dispatch,
  type SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react'
import { useNavigationGuard } from 'next-navigation-guard'

type ContentLockState = {
  hasChanges: boolean
  setHasChanges: Dispatch<SetStateAction<boolean>>
}

const ContentLockContext = createContext<ContentLockState | null>(null)
const LEAVE_CONFIRMATION_MESSAGE =
  'You have unsaved changes. Are you sure you want to leave?'

const useContentLockState = (): ContentLockState => {
  const [hasChanges, setHasChanges] = useState(false)
  const skipNextGuardRef = useRef(false)

  const confirmNavigation = useCallback(() => {
    return window.confirm(LEAVE_CONFIRMATION_MESSAGE)
  }, [])

  useNavigationGuard({
    enabled: hasChanges,
    confirm: () => {
      if (skipNextGuardRef.current) {
        skipNextGuardRef.current = false
        return true
      }

      const confirmed = confirmNavigation()

      if (!confirmed) {
        window.history.pushState(null, '', window.location.href)
      }

      return confirmed
    }
  })

  // hack to prevent navigation guard leaving the page on back/forward
  useEffect(() => {
    if (!hasChanges) return

    window.history.pushState(null, '', window.location.href)
  }, [hasChanges])

  useEffect(() => {
    if (!hasChanges) return

    const handleDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return

      // Primary click without modifiers only.
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return
      }

      if (!(event.target instanceof Element)) return

      const anchor = event.target.closest('a[href]')
      if (!(anchor instanceof HTMLAnchorElement)) return

      if (anchor.hasAttribute('download')) return

      const target = anchor.getAttribute('target')
      if (target && target.toLowerCase() !== '_self') return

      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#') || href.startsWith('javascript:')) {
        return
      }

      const nextUrl = new URL(anchor.href, window.location.href)
      const currentUrl = new URL(window.location.href)
      const isSameUrl =
        nextUrl.origin === currentUrl.origin &&
        nextUrl.pathname === currentUrl.pathname &&
        nextUrl.search === currentUrl.search &&
        nextUrl.hash === currentUrl.hash

      if (isSameUrl) return

      const confirmed = confirmNavigation()
      if (!confirmed) {
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()
        return
      }

      // If next-navigation-guard also intercepts this navigation,
      // skip duplicate confirmation.
      skipNextGuardRef.current = true
      window.setTimeout(() => {
        skipNextGuardRef.current = false
      }, 0)
    }

    document.addEventListener('click', handleDocumentClick, true)

    return () => {
      document.removeEventListener('click', handleDocumentClick, true)
    }
  }, [hasChanges, confirmNavigation])

  return { hasChanges, setHasChanges }
}

export const ContentLockProvider = ({ children }: { children: ReactNode }) => {
  const contentLock = useContentLockState()

  const value = useMemo(
    () => ({
      hasChanges: contentLock.hasChanges,
      setHasChanges: contentLock.setHasChanges
    }),
    [contentLock.hasChanges, contentLock.setHasChanges]
  )

  return createElement(ContentLockContext.Provider, { value }, children)
}

export const useContentLock = (): ContentLockState => {
  const context = useContext(ContentLockContext)

  // Fallback keeps hook usage resilient in tests or custom mounts
  // that don't include RootProvider.
  const fallbackState = useState(false)

  if (!context) {
    const [hasChanges, setHasChanges] = fallbackState
    return { hasChanges, setHasChanges }
  }

  return context
}
