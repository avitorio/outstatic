import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/** Ask for confirmation before changing page or leaving site.
 *
 * @see https://git.io/JOskG
 */
const useNavigationLock = (
  isEnabled = true,
  warningText = 'You have unsaved changes – are you sure you wish to leave this page?'
) => {
  const router = useRouter()

  useEffect(() => {
    const handleWindowClose = (e: BeforeUnloadEvent) => {
      if (!isEnabled) return
      e.preventDefault()
      return (e.returnValue = warningText)
    }

    const handleBrowseAway = () => {
      if (!isEnabled) return
      if (window.confirm(warningText)) return
      // router.events.emit('routeChangeError')
      // if (router.asPath !== window.location.pathname) {
      //   window.history.pushState('', '', router.asPath)
      // }

      throw 'Navigation cancelled'
    }

    window.addEventListener('beforeunload', handleWindowClose)

    // TODO: Handle route change events
    // router.events.on('routeChangeStart', handleBrowseAway)

    return () => {
      window.removeEventListener('beforeunload', handleWindowClose)
      // router.events.off('routeChangeStart', handleBrowseAway)
    }
  }, [isEnabled, router, warningText])
}

export default useNavigationLock
