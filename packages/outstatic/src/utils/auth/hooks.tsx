import { useInitialData } from '@/utils/hooks/useInitialData'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import useSWR from 'swr'
import { OUTSTATIC_API_PATH } from '../constants'
import { LoginSession } from './auth'

type useOstSessionProps = {
  redirectTo?: string
  redirectIfFound?: boolean
}

type useOstSessionReturn = {
  session: LoginSession | null
  status: 'loading' | 'unauthenticated' | 'authenticated'
}

const fetcher = (url: string) =>
  fetch(url)
    .then((r) => {
      return r.json()
    })
    .then((data) => {
      return data || null
    })

export const useOstSession = ({
  redirectTo,
  redirectIfFound
}: useOstSessionProps = {}): useOstSessionReturn => {
  const { basePath } = useInitialData()
  const { data, error } = useSWR(
    (basePath || '') + OUTSTATIC_API_PATH + '/user',
    fetcher
  )
  const session = data?.session as LoginSession
  const finished = Boolean(data)
  const hasUser = Boolean(session)
  const router = useRouter()

  useEffect(() => {
    if (!redirectTo || !finished) return
    if (
      // If redirectTo is set, redirect if the user was not found.
      (redirectTo && !redirectIfFound && !hasUser) ||
      // If redirectIfFound is also set, redirect if the user was found
      (redirectIfFound && hasUser)
    ) {
      router.push(redirectTo)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [redirectTo, redirectIfFound, finished, hasUser])

  if (!data) {
    return {
      session: null,
      status: 'loading'
    }
  }

  if ((data && !hasUser) || error) {
    return {
      session: null,
      status: 'unauthenticated'
    }
  }

  return {
    session,
    status: 'authenticated'
  }
}

export function useOstSignOut() {
  const router = useRouter()

  const signOut = () => {
    router.push(OUTSTATIC_API_PATH + '/signout')
  }

  return { signOut }
}
