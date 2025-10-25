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
  provider?: 'github' | 'magic-link' | 'seamless'
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
    return updatedSession
  } catch (error) {
    console.error('Failed to refresh token:', error)
    throw new Error('Token refresh failed')
  }
}

// Map to track ongoing refresh operations to prevent multiple concurrent refreshes
const refreshOperations = new Map<string, Promise<LoginSession>>()

// Helper function to refresh token with concurrent request handling
export async function refreshTokenIfNeeded(
  session: LoginSession
): Promise<LoginSession> {
  // If token is not expired, return the session as is
  if (!isTokenExpired(session.expires)) {
    return session
  }

  // If no refresh token or refresh token is expired, throw error
  if (!isRefreshTokenValid(session)) {
    throw new Error('Token expired and no valid refresh token available')
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
