import { OUTSTATIC_API_PATH } from '@/utils/constants'
import { queryClient } from '@/utils/react-query/queryClient'

type RefreshOptions = {
  basePath?: string
  onSessionUpdate?: (session: any) => void
}

type RefreshState = {
  refreshing: boolean
  lastRefreshTime: number
  refreshFailed: boolean
  isRedirecting: boolean
}

// Shared state across all instances (for cross-tab coordination)
const refreshState: RefreshState = {
  refreshing: false,
  lastRefreshTime: 0,
  refreshFailed: false,
  isRedirecting: false
}

const BROADCAST_CHANNEL_NAME = 'ost_auth_channel'
const LOCK_TIMEOUT = 10000 // 10 seconds
const REFRESH_COOLDOWN = 5000 // 5 seconds cooldown between refreshes

type BroadcastMessage =
  | { type: 'REFRESH_LOCK'; timestamp: number; tabId: string }
  | { type: 'REFRESH_SUCCESS'; timestamp: number }
  | { type: 'REFRESH_FAILED'; timestamp: number }

// Singleton Broadcast Channel instance
let broadcastChannel: BroadcastChannel | null = null
const tabId = `tab_${Date.now()}_${Math.random()}`
let refreshLock: { timestamp: number; tabId: string } | null = null

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined') return null

  if (!broadcastChannel) {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME)

    // Listen for messages from other tabs
    broadcastChannel.onmessage = (event: MessageEvent<BroadcastMessage>) => {
      const message = event.data

      if (message.type === 'REFRESH_LOCK') {
        // Another tab is refreshing
        if (message.tabId !== tabId && (!refreshLock || message.timestamp > refreshLock.timestamp)) {
          refreshLock = {
            timestamp: message.timestamp,
            tabId: message.tabId
          }
        }
      } else if (message.type === 'REFRESH_SUCCESS') {
        // Another tab succeeded - clear our lock if it was theirs
        if (refreshLock && refreshLock.tabId !== tabId) {
          refreshLock = null
        }
      } else if (message.type === 'REFRESH_FAILED') {
        // Another tab failed - clear our lock if it was theirs
        if (refreshLock && refreshLock.tabId !== tabId) {
          refreshLock = null
        }
      }
    }
  }

  return broadcastChannel
}

/**
 * Refreshes the authentication token with cross-tab coordination
 * Returns the new session data if successful, throws error if failed
 */
export async function refreshTokenWithCoordination(
  options: RefreshOptions
): Promise<any> {
  const { basePath = '', onSessionUpdate } = options

  // If we already know refresh failed or we're redirecting, don't try again
  if (refreshState.refreshFailed || refreshState.isRedirecting) {
    throw new Error('Token refresh already failed')
  }

  if (refreshState.refreshing) {
    // Wait for existing refresh to complete
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (!refreshState.refreshing) {
          clearInterval(checkInterval)
          if (refreshState.refreshFailed) {
            reject(new Error('Token refresh failed'))
          } else {
            // Fetch updated session
            fetchUpdatedSession(basePath, onSessionUpdate).then(resolve).catch(reject)
          }
        }
      }, 100)

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval)
        reject(new Error('Token refresh timeout'))
      }, 10000)
    })
  }

  // Prevent rapid successive refreshes
  const timeSinceLastRefresh = Date.now() - refreshState.lastRefreshTime
  if (timeSinceLastRefresh < REFRESH_COOLDOWN) {
    throw new Error('Token refresh cooldown active')
  }

  // Check if another tab has a lock via Broadcast Channel
  const channel = getBroadcastChannel()
  if (refreshLock && refreshLock.tabId !== tabId) {
    const lockAge = Date.now() - refreshLock.timestamp
    if (lockAge < LOCK_TIMEOUT) {
      throw new Error('Another tab is refreshing token')
    }
  }

  try {
    refreshState.refreshing = true
    refreshState.lastRefreshTime = Date.now()

    // Acquire lock - signal to other tabs that we're refreshing
    const lockTimestamp = Date.now()
    refreshLock = { timestamp: lockTimestamp, tabId }

    if (channel) {
      channel.postMessage({
        type: 'REFRESH_LOCK',
        timestamp: lockTimestamp,
        tabId
      } as BroadcastMessage)
    }

    const response = await fetch(`${basePath}${OUTSTATIC_API_PATH}/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (!data.success) {
      throw new Error('Token refresh failed')
    }

    // Token refreshed or extended successfully
    refreshState.refreshFailed = false

    // Fetch the updated session to get the new access_token
    const session = await fetchUpdatedSession(basePath, onSessionUpdate)

    // Broadcast success to other tabs
    if (channel) {
      channel.postMessage({
        type: 'REFRESH_SUCCESS',
        timestamp: Date.now()
      } as BroadcastMessage)
    }

    // Invalidate all queries to trigger refetch with the new session cookie
    queryClient.invalidateQueries()

    return session
  } catch (error) {
    console.error('Failed to refresh token:', error)

    // Mark refresh as failed to prevent retry loops
    refreshState.refreshFailed = true
    refreshState.isRedirecting = true

    // Broadcast failure to other tabs
    if (channel) {
      channel.postMessage({
        type: 'REFRESH_FAILED',
        timestamp: Date.now()
      } as BroadcastMessage)
    }

    throw error
  } finally {
    // Release lock
    refreshLock = null
    refreshState.refreshing = false
  }
}

/**
 * Fetches the updated session after token refresh
 */
async function fetchUpdatedSession(
  basePath: string,
  onSessionUpdate?: (session: any) => void
): Promise<any> {
  try {
    const sessionResponse = await fetch(`${basePath}${OUTSTATIC_API_PATH}/user`)
    if (sessionResponse.ok) {
      const { session } = await sessionResponse.json()
      if (session && onSessionUpdate) {
        onSessionUpdate(session)
      }
      return session
    }
    throw new Error('Failed to fetch updated session')
  } catch (error) {
    console.error('Failed to fetch updated session:', error)
    throw error
  }
}

/**
 * Resets the refresh state (useful for testing or after successful login)
 */
export function resetRefreshState() {
  refreshState.refreshing = false
  refreshState.refreshFailed = false
  refreshState.isRedirecting = false
  refreshLock = null
}
