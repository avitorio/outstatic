import { Session } from '@/types'
import * as Iron from '@hapi/iron'

import { cookies } from 'next/headers'

export type LoginSession = {
  user: {
    name: string
    login: string
    email: string
    image: string
  }
  access_token: string
  expires: Date
}

export type Request = {
  cookies: Partial<{
    [key: string]: string
  }>
  headers: {
    cookie: string
  }
}

import { TOKEN_SECRET, MAX_AGE, TOKEN_NAME } from '@/utils/constants'

export async function setLoginSession(session: LoginSession) {
  // Create a session object with a max age that we can validate later
  const obj = { ...session }
  const token = await Iron.seal(obj, TOKEN_SECRET, Iron.defaults)
  cookies().set(TOKEN_NAME, token, {
    maxAge: MAX_AGE,
    expires: new Date(Date.now() + MAX_AGE),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax'
  })

  return true
}

export async function getLoginSession(): Promise<Session | null> {
  const cookieStore = cookies()
  const token = cookieStore.get(TOKEN_NAME)?.value
  if (!token) return null

  try {
    const session = await Iron.unseal(token, TOKEN_SECRET, Iron.defaults)
    const expires = new Date(session.expires).getTime()
    // Validate the expiration date of the session
    if (Date.now() > expires) {
      throw new Error('Session expired')
    }

    return session
  } catch {
    return null
  }
}
