import Router from 'next/router'
import { useEffect } from 'react'
import useSWR from 'swr'
import { Session } from '../../types'

type useOstSessionProps = {
  redirectTo?: string
  redirectIfFound?: boolean
}

type useOstSessionReturn = {
  session: Session | null
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
  const { data, error } = useSWR('/api/outstatic/user', fetcher)
  const session = data?.session as Session
  const finished = Boolean(data)
  const hasUser = Boolean(session)

  useEffect(() => {
    if (!redirectTo || !finished) return
    if (
      // If redirectTo is set, redirect if the user was not found.
      (redirectTo && !redirectIfFound && !hasUser) ||
      // If redirectIfFound is also set, redirect if the user was found
      (redirectIfFound && hasUser)
    ) {
      Router.push(redirectTo)
    }
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

export async function ostSignOut() {
  Router.push('/api/outstatic/signout')
}
