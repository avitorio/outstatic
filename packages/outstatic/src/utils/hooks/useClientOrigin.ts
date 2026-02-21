import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}

export const useClientOrigin = () =>
  useSyncExternalStore(
    subscribe,
    () => window.location.origin,
    () => ''
  )
