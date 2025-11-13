'use client'

import { OUTSTATIC_API_PATH } from '@/utils/constants'
import { queryClient } from '@/utils/react-query/queryClient'
import { LoginSession } from '@/utils/auth/auth'
import { ReactNode, createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

type AuthContextType = {
  session: LoginSession | null
  updateSession: (session: LoginSession | null) => void
  signOut: () => void
  basePath: string
  status: 'loading' | 'unauthenticated' | 'authenticated'
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const BROADCAST_CHANNEL_NAME = 'ost_auth_channel'

type BroadcastMessage =
  | { type: 'REFRESH_LOCK'; timestamp: number }
  | { type: 'REFRESH_SUCCESS'; timestamp: number; session?: LoginSession }
  | { type: 'REFRESH_FAILED'; timestamp: number }
  | { type: 'SESSION_UPDATE'; session: LoginSession }
  | { type: 'SIGN_OUT'; timestamp: number }

type AuthProviderProps = {
  children: ReactNode
  initialSession: LoginSession | null
  basePath: string
}

export function AuthProvider({ children, initialSession, basePath }: AuthProviderProps) {
  const router = useRouter()
  const [session, setSession] = useState<LoginSession | null>(initialSession)
  const [isInitializing, setIsInitializing] = useState(true)
  const channelRef = useRef<BroadcastChannel | null>(null)

  // Determine status based on session
  const status: 'loading' | 'unauthenticated' | 'authenticated' =
    isInitializing
      ? 'loading'
      : session
        ? 'authenticated'
        : 'unauthenticated'

  // Initialize session on mount
  useEffect(() => {
    // If we have an initial session, we're ready
    if (initialSession) {
      setIsInitializing(false)
      return
    }

    // Otherwise, fetch the session
    const fetchSession = async () => {
      try {
        const response = await fetch(`${basePath}${OUTSTATIC_API_PATH}/user`)
        if (response.ok) {
          const { session: fetchedSession } = await response.json()
          setSession(fetchedSession || null)
        }
      } catch (error) {
        console.error('Failed to fetch initial session:', error)
      } finally {
        setIsInitializing(false)
      }
    }

    fetchSession()
  }, [basePath, initialSession])

  // Initialize Broadcast Channel
  useEffect(() => {
    if (typeof window === 'undefined') return

    const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME)
    channelRef.current = channel

    channel.onmessage = async (event: MessageEvent<BroadcastMessage>) => {
      const message = event.data

      switch (message.type) {
        case 'REFRESH_SUCCESS': {
          // Another tab successfully refreshed - fetch updated session
          try {
            const sessionResponse = await fetch(`${basePath}${OUTSTATIC_API_PATH}/user`)
            if (sessionResponse.ok) {
              const { session: updatedSession } = await sessionResponse.json()
              if (updatedSession) {
                setSession(updatedSession)
                setIsInitializing(false)
                queryClient.invalidateQueries()
              }
            }
          } catch (error) {
            console.error('Failed to fetch updated session in cross-tab listener:', error)
          }
          break
        }

        case 'REFRESH_FAILED': {
          // Another tab failed to refresh - prepare to redirect
          if (!window.location.pathname.includes('/outstatic')) {
            toast.error('Session expired. Please log in again.')
            setTimeout(() => {
              router.push(`${basePath}/outstatic`)
            }, 100)
          }
          break
        }

        case 'SESSION_UPDATE': {
          // Direct session update from another tab
          setSession(message.session)
          setIsInitializing(false)
          queryClient.invalidateQueries()
          break
        }

        case 'SIGN_OUT': {
          // Another tab signed out - clear session and redirect
          setSession(null)
          setIsInitializing(false)
          queryClient.invalidateQueries()

          // Redirect to login page if not already there
          // Use setTimeout to defer navigation outside of render phase
          if (!window.location.pathname.includes('/outstatic')) {
            setTimeout(() => {
              router.push(`${basePath}/outstatic`)
            }, 0)
          }
          break
        }
      }
    }

    return () => {
      channel.close()
      channelRef.current = null
    }
  }, [basePath, router])

  const updateSession = useCallback((newSession: LoginSession | null) => {
    setSession(newSession)
    setIsInitializing(false)

    // Broadcast session update to other tabs
    if (channelRef.current && newSession) {
      channelRef.current.postMessage({
        type: 'SESSION_UPDATE',
        session: newSession
      } as BroadcastMessage)
    }
  }, [])

  const signOut = useCallback(() => {
    // Clear session immediately
    setSession(null)
    setIsInitializing(false)

    // Broadcast sign out to all tabs
    if (channelRef.current) {
      channelRef.current.postMessage({
        type: 'SIGN_OUT',
        timestamp: Date.now()
      } as BroadcastMessage)
    }

    // Invalidate queries
    queryClient.invalidateQueries()

    // Redirect to signout endpoint (which clears the cookie)
    router.push(`${basePath}${OUTSTATIC_API_PATH}/signout`)
  }, [basePath, router])

  const contextValue: AuthContextType = {
    session,
    updateSession,
    signOut,
    basePath,
    status
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

