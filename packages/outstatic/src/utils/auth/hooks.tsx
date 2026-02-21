import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from './auth-provider'
import type { LoginSession } from './auth'

type useOstSessionProps = {
  redirectTo?: string
  redirectIfFound?: boolean
}

type useOstSessionReturn = {
  session: LoginSession | null
  status: 'loading' | 'unauthenticated' | 'authenticated'
}

/**
 * Hook to access the current Outstatic session
 * Uses the AuthProvider as the single source of truth
 */
export const useOstSession = ({
  redirectTo,
  redirectIfFound
}: useOstSessionProps = {}): useOstSessionReturn => {
  const { session, status } = useAuth()
  const router = useRouter()
  const hasUser = Boolean(session)

  useEffect(() => {
    if (!redirectTo || status === 'loading') return

    if (
      // If redirectTo is set, redirect if the user was not found.
      (redirectTo && !redirectIfFound && !hasUser) ||
      // If redirectIfFound is also set, redirect if the user was found
      (redirectIfFound && hasUser)
    ) {
      router.push(redirectTo)
    }
  }, [redirectTo, redirectIfFound, status, hasUser, router])

  return {
    session,
    status
  }
}
