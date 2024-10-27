import { useEffect, useState } from 'react'
import { useNavigationGuard } from 'next-navigation-guard'

export const useContentLock = () => {
  const [hasChanges, setHasChanges] = useState(false)
  useNavigationGuard({
    enabled: hasChanges,
    confirm: () => {
      const confirmed = window.confirm('Leaving?')

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

  return { hasChanges, setHasChanges }
}
