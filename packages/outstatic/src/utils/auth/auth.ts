import * as Iron from '@hapi/iron'
import { cookies } from 'next/headers'
import { TOKEN_SECRET, TOKEN_NAME } from '@/utils/constants'
import { getAccessToken } from './github'

export type LoginSession = {
  user: {
    name: string
    login: string
    email: string
    image: string
  }
  access_token: string
  expires: Date
  refresh_token?: string
  refresh_token_expires?: Date
}

export type Request = {
  cookies: Partial<{
    [key: string]: string
  }>
  headers: {
    cookie: string
  }
}

export async function setLoginSession(session: LoginSession) {
  // Create a session object with a max age that we can validate later
  const obj = { ...session }
  const token = await Iron.seal(obj, TOKEN_SECRET, Iron.defaults)
  const cookieStore = await cookies()
  cookieStore.set(TOKEN_NAME, token, {
    maxAge:
      (session.refresh_token_expires ?? session.expires).getTime() - Date.now(),
    expires: session.refresh_token_expires ?? session.expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax'
  })

  return true
}

export async function getLoginSession(): Promise<LoginSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(TOKEN_NAME)?.value
  if (!token) return null

  try {
    const session: LoginSession = await Iron.unseal(
      token,
      TOKEN_SECRET,
      Iron.defaults
    )
    const expires = new Date(session.expires).getTime()

    if (Date.now() <= expires) {
      return session
    }

    // If the access token is expired but we have a valid refresh token, try to refresh it
    if (
      Date.now() > expires &&
      session.refresh_token &&
      (!session.refresh_token_expires ||
        Date.now() <= new Date(session.refresh_token_expires).getTime())
    ) {
      const {
        access_token,
        expires_in,
        refresh_token,
        refresh_token_expires_in
      } = await getAccessToken({
        refresh_token: session.refresh_token,
        grant_type: 'refresh_token'
      })

      if (access_token) {
        // Update the session with new tokens
        const updatedSession: LoginSession = {
          ...session,
          access_token,
          expires: new Date(Date.now() + expires_in),
          refresh_token: refresh_token || session.refresh_token,
          refresh_token_expires: refresh_token_expires_in
            ? new Date(Date.now() + refresh_token_expires_in)
            : session.refresh_token_expires
        }

        // Save the updated session
        await setLoginSession(updatedSession)
        return updatedSession
      }
    }

    throw new Error('Session expired')
  } catch {
    return null
  }
}
