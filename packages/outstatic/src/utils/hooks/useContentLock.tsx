import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

type RouterEvents = 'beforeRouteChange' | 'afterRouteChange'

type CallbackResult = boolean | void
type Callback = () => Promise<CallbackResult> | CallbackResult

export const useRouterEvents = (() => {
  let patched = false

  const listeners: Record<RouterEvents, Array<Callback>> = {
    beforeRouteChange: [],
    afterRouteChange: []
  }

  const eventHandler = async (eventName: RouterEvents) => {
    const arr = listeners[eventName]

    return await Promise.all(arr.map((cb) => cb()))
  }

  const addEventListener = (eventName: RouterEvents, callback: Callback) => {
    const arr = listeners[eventName]
    arr.push(callback)
  }

  const removeEventListener = (eventName: RouterEvents, callback: Callback) => {
    const arr = listeners[eventName]
    listeners[eventName] = arr.filter((cb) => cb !== callback)
  }

  return () => {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    useEffect(() => {
      if (!patched) {
        const _back = router.back
        router.back = async function () {
          const result = await eventHandler('beforeRouteChange')

          if (result.includes(false)) {
            return
          }

          // @ts-ignore
          _back(...arguments)
        }

        const _forward = router.forward
        router.forward = async function () {
          const result = await eventHandler('beforeRouteChange')

          if (result.includes(false)) {
            return
          }

          // @ts-ignore
          _forward(...arguments)
        }

        const _push = router.push
        router.push = async function () {
          const result = await eventHandler('beforeRouteChange')

          if (result.includes(false)) {
            return
          }

          eventHandler('beforeRouteChange')
          // @ts-ignore
          _push(...arguments)
        }

        const _replace = router.push
        router.replace = async function () {
          const result = await eventHandler('beforeRouteChange')

          if (result.includes(false)) {
            return
          }

          // @ts-ignore
          _replace(...arguments)
        }

        patched = true
      }
    }, [])

    useEffect(() => {
      return () => {
        eventHandler('afterRouteChange')
      }
    }, [pathname, searchParams])

    return {
      addEventListener,
      removeEventListener
    }
  }
})()

export const useContentLock = () => {
  const [hasChanges, setHasChanges] = useState(false)
  const routerEvents = useRouterEvents()
  const router = useRouter()

  useEffect(() => {
    const handleBeforeRouteChange = () => {
      if (hasChanges) {
        const confirmed = window.confirm(
          'You have unsaved changes. Are you sure you want to leave?'
        )
        return confirmed
      }
      return true
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    routerEvents.addEventListener('beforeRouteChange', handleBeforeRouteChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      routerEvents.removeEventListener(
        'beforeRouteChange',
        handleBeforeRouteChange
      )
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [hasChanges, routerEvents])

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (hasChanges) {
        if (
          !window.confirm(
            'You have unsaved changes. Are you sure you want to leave?'
          )
        ) {
          e.preventDefault()
          window.history.pushState(null, '', window.location.href)
        } else {
          router.back()
        }
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [hasChanges])

  return { hasChanges, setHasChanges }
}
