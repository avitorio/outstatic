import * as Iron from '@hapi/iron'
import { NextApiRequest, NextApiResponse } from 'next'
import { NextIncomingMessage } from 'next/dist/server/request-meta'
import { Session } from '../../types'
import { MAX_AGE, setTokenCookie, getTokenCookie } from './auth-cookies'

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

export type Request =
  | NextApiRequest
  | (NextIncomingMessage & {
      cookies: Partial<{
        [key: string]: string
      }>
    })

const TOKEN_SECRET = process.env.OST_TOKEN_SECRET ?? ''

export async function setLoginSession(
  res: NextApiResponse,
  session: LoginSession
) {
  // Create a session object with a max age that we can validate later
  const obj = { ...session }
  const token = await Iron.seal(obj, TOKEN_SECRET, Iron.defaults)
  setTokenCookie(res, token)
}

export async function getLoginSession(req: Request): Promise<Session | null> {
  const token = getTokenCookie(req)

  if (!token) return null

  try {
    const session = await Iron.unseal(token, TOKEN_SECRET, Iron.defaults)
    const expires = session.expires + MAX_AGE * 1000
    // Validate the expiration date of the session
    if (Date.now() > expires) {
      throw new Error('Session expired')
    }

    return session
  } catch {
    return null
  }
}
