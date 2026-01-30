import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import {
  TOKEN_SECRET,
  TOKEN_NAME,
  COOKIE_SETTINGS,
  SESSION_ERROR_MESSAGES,
  OST_PRO_API_URL,
  MAX_AGE
} from '@/utils/constants'
import { getAccessToken } from './github'

export type AppPermissions =
  | 'roles.manage'
  | 'settings.manage'
  | 'members.manage'
  | 'invites.manage'
  | 'collections.manage'
  | 'content.manage'
  | 'projects.manage'

export type LoginSession = {
  user: {
    name: string
    login: string
    email: string
    image: string
    permissions?: AppPermissions[]
  }
  provider?: 'github' | 'magic-link'
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

// Helper function to check if token is expired
export function isTokenExpired(expires: Date): boolean {
  return Date.now() >= expires.getTime()
}

// Helper function to check if refresh token is valid
export function isRefreshTokenValid(session: LoginSession): boolean {
  if (!session.refresh_token) return false

  if (!session.refresh_token_expires) return true

  return Date.now() < session.refresh_token_expires.getTime()
}

// Helper function to refresh token
export async function refreshToken(
  session: LoginSession
): Promise<LoginSession> {
  if (!session.refresh_token) {
    throw new Error('No refresh token available')
  }

  if (!isRefreshTokenValid(session)) {
    throw new Error('Refresh token is expired')
  }

  try {
    // Handle different providers
    if (session.provider === 'github') {
      // GitHub OAuth flow
      const {
        access_token,
        expires_in,
        refresh_token,
        refresh_token_expires_in
      } = await getAccessToken({
        refresh_token: session.refresh_token,
        grant_type: 'refresh_token'
      })

      if (!access_token) {
        throw new Error('Failed to refresh access token')
      }

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
      console.log('Session updated successfully')
      return updatedSession
    } else if (session.provider === 'magic-link') {
      // Magic link - call main SaaS app
      const response = await fetch(
        `${OST_PRO_API_URL}/outstatic/auth/refresh-token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            refresh_token: session.refresh_token
          })
        }
      )

      if (!response.ok) {
        console.error(
          'Failed to refresh token:',
          response.status,
          await response.text()
        )
        throw new Error('Failed to refresh access token')
      }

      const data = await response.json()

      // Update the session with new tokens
      const updatedSession: LoginSession = {
        ...session,
        access_token: data.session.access_token,
        expires: new Date(data.session.expires_at * 1000),
        refresh_token: data.session.refresh_token || session.refresh_token,
        refresh_token_expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }

      // Save the updated session
      await setLoginSession(updatedSession)
      console.log('Session updated successfully')
      return updatedSession
    } else {
      throw new Error(`Unknown provider: ${session.provider}`)
    }
  } catch (error) {
    console.error('Failed to refresh token:', error)
    throw new Error('Token refresh failed')
  }
}

// Map to track ongoing refresh operations to prevent multiple concurrent refreshes
const refreshOperations = new Map<string, Promise<LoginSession>>()

// Helper function to refresh token with concurrent request handling
// This is only called from the /api/outstatic/auth/refresh endpoint (never directly from components)
export async function refreshTokenIfNeeded(
  session: LoginSession
): Promise<LoginSession> {
  // If token is not expired, return the session as is
  if (!isTokenExpired(session.expires)) {
    return session
  }

  // If no refresh token is available (e.g., standard GitHub OAuth App)
  // extend the session without refreshing since these tokens don't expire
  if (!session.refresh_token) {
    console.log(
      'No refresh token available. Extending session for provider:',
      session.provider
    )

    // For GitHub OAuth Apps and other providers without refresh tokens,
    // the access token typically doesn't expire or lasts a very long time
    // We extend the session cookie to keep the user logged in
    const extendedSession: LoginSession = {
      ...session,
      expires: new Date(Date.now() + MAX_AGE * 1000) // Extend by MAX_AGE (30 days)
    }

    await setLoginSession(extendedSession)
    return extendedSession
  }

  // If refresh token is expired, throw error
  if (!isRefreshTokenValid(session)) {
    throw new Error('Refresh token is expired')
  }

  // Create a unique key for this refresh operation based on the refresh token
  const refreshKey = session.refresh_token!

  // Check if there's already a refresh operation in progress for this token
  if (refreshOperations.has(refreshKey)) {
    // Wait for the existing refresh operation to complete
    return await refreshOperations.get(refreshKey)!
  }

  // Start a new refresh operation
  const refreshPromise = refreshToken(session)
  refreshOperations.set(refreshKey, refreshPromise)

  try {
    const refreshedSession = await refreshPromise
    return refreshedSession
  } finally {
    // Clean up the refresh operation from the map
    refreshOperations.delete(refreshKey)
  }
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

  try {
    cookieStore.set(TOKEN_NAME, token, {
      maxAge: Math.floor(maxAge / 1000), // Convert to seconds
      expires: session.refresh_token_expires ?? session.expires,
      ...COOKIE_SETTINGS
    })
    return true
  } catch (error) {
    // Cookies can only be modified in Server Actions or Route Handlers
    // If we're in a Server Component, this will fail - that's expected
    console.warn(
      'Unable to set session cookie (likely called from Server Component)',
      error instanceof Error ? error.message : error
    )
    return false
  }
}

export async function getLoginSession(): Promise<LoginSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(TOKEN_NAME)?.value

  if (!token) {
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

    return session
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
