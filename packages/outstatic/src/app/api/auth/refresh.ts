import { NextResponse } from 'next/server'
import { Request } from '@/app/api'
import {
  getLoginSession,
  refreshTokenIfNeeded,
  LoginSession
} from '@/utils/auth/auth'

/**
 * API endpoint to refresh the authentication token
 * This is called from the client side when a 401/403 error is detected
 */
export default async function refresh(request: Request): Promise<Response> {
  try {
    // Get the current session
    const session = await getLoginSession()

    if (!session) {
      console.error('Refresh failed: No active session found')
      return NextResponse.json(
        { error: 'No active session found' },
        { status: 401 }
      )
    }

    console.log('Refresh token request - Provider:', session.provider, 'Has refresh token:', !!session.refresh_token)

    // Attempt to refresh the token
    let refreshedSession: LoginSession
    let refreshType: 'refreshed' | 'extended' = 'refreshed'

    try {
      const hadRefreshToken = !!session.refresh_token
      refreshedSession = await refreshTokenIfNeeded(session)
      refreshType = hadRefreshToken ? 'refreshed' : 'extended'

      console.log(
        `Token ${refreshType} successfully for provider ${session.provider}. New expiry:`,
        refreshedSession.expires.toISOString()
      )
    } catch (refreshError) {
      console.error('Token refresh failed:', refreshError)
      return NextResponse.json(
        {
          error:
            refreshError instanceof Error
              ? refreshError.message
              : 'Token refresh failed'
        },
        { status: 401 }
      )
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        expires: refreshedSession.expires.toISOString(),
        type: refreshType
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Unexpected error during token refresh:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

