import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import {
  TOKEN_SECRET,
  TOKEN_NAME,
  COOKIE_SETTINGS,
  SESSION_ERROR_MESSAGES
} from '@/utils/constants'
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

// More specific type for request objects
export type AuthRequest = {
  cookies: Partial<Record<string, string>>
  headers: {
    cookie?: string
  }
}

// Type for token refresh response
export type TokenRefreshResponse = {
  access_token: string
  expires_in: number
  refresh_token?: string
  refresh_token_expires_in?: number
}

// Helper function to check if a value is a valid date (Date object or date string)
function isValidDate(value: any): boolean {
  if (value instanceof Date) return true
  if (typeof value === 'string') {
    const date = new Date(value)
    return !isNaN(date.getTime())
  }
  return false
}

// Helper function to convert date strings back to Date objects
function normalizeDates(session: any): LoginSession {
  return {
    ...session,
    expires:
      session.expires instanceof Date
        ? session.expires
        : new Date(session.expires),
    refresh_token_expires: session.refresh_token_expires
      ? session.refresh_token_expires instanceof Date
        ? session.refresh_token_expires
        : new Date(session.refresh_token_expires)
      : undefined
  }
}

// Validation function for session data
function validateSession(session: any): session is LoginSession {
  const isValid =
    session &&
    typeof session === 'object' &&
    session.user &&
    typeof session.user.name === 'string' &&
    typeof session.user.login === 'string' &&
    typeof session.user.email === 'string' &&
    typeof session.user.image === 'string' &&
    typeof session.access_token === 'string' &&
    isValidDate(session.expires)

  if (!isValid) {
    console.warn('Session validation failed:', {
      hasSession: !!session,
      sessionType: typeof session,
      hasUser: !!session?.user,
      userName: typeof session?.user?.name,
      userLogin: typeof session?.user?.login,
      userEmail: typeof session?.user?.email,
      userImage: typeof session?.user?.image,
      accessToken: typeof session?.access_token,
      expiresValid: isValidDate(session?.expires),
      expiresValue: session?.expires
    })
  }

  return isValid
}

export async function setLoginSession(session: LoginSession): Promise<boolean> {
  if (!validateSession(session)) {
    throw new Error(SESSION_ERROR_MESSAGES.INVALID_SESSION)
  }

  // Create a JWT token with the session data
  const secret = new TextEncoder().encode(TOKEN_SECRET)
  const token = await new SignJWT({ ...session })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(session.refresh_token_expires ?? session.expires)
    .sign(secret)

  const cookieStore = await cookies()

  const maxAge = Math.max(
    (session.refresh_token_expires ?? session.expires).getTime() - Date.now(),
    0 // Ensure maxAge is never negative
  )

  cookieStore.set(TOKEN_NAME, token, {
    maxAge: Math.floor(maxAge / 1000), // Convert to seconds
    expires: session.refresh_token_expires ?? session.expires,
    ...COOKIE_SETTINGS
  })

  return true
}

export async function getLoginSession(): Promise<LoginSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(TOKEN_NAME)?.value

  if (!token) {
    console.log('No token found in cookies')
    return null
  }

  try {
    const secret = new TextEncoder().encode(TOKEN_SECRET)
    const { payload } = await jwtVerify(token, secret)

    // Normalize dates (convert strings back to Date objects)
    const session = normalizeDates(payload)

    // Validate the session structure
    if (!validateSession(session)) {
      console.warn(SESSION_ERROR_MESSAGES.INVALID_STRUCTURE, session)
      return null
    }

    const expires = session.expires.getTime()
    const now = Date.now()

    if (now <= expires) {
      return session
    }

    // If the access token is expired but we have a valid refresh token, try to refresh it
    if (
      now > expires &&
      session.refresh_token &&
      (!session.refresh_token_expires ||
        now <= session.refresh_token_expires.getTime())
    ) {
      try {
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
            expires: new Date(now + expires_in),
            refresh_token: refresh_token || session.refresh_token,
            refresh_token_expires: refresh_token_expires_in
              ? new Date(now + refresh_token_expires_in)
              : session.refresh_token_expires
          }

          // Save the updated session
          await setLoginSession(updatedSession)
          return updatedSession
        }
      } catch (refreshError) {
        console.error('Failed to refresh token:', refreshError)
        // Continue to throw session expired error
      }
    }

    throw new Error(SESSION_ERROR_MESSAGES.SESSION_EXPIRED)
  } catch (error) {
    console.error('Session validation error:', error)
    return null
  }
}

// Helper function to clear session
export async function clearLoginSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(TOKEN_NAME, '', {
    maxAge: -1,
    ...COOKIE_SETTINGS
  })
}
