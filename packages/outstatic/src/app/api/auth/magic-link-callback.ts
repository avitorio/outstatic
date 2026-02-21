import {
  LoginSession,
  AppPermissions,
  setLoginSession,
  resolveRefreshTokenExpiry
} from '@/utils/auth/auth'
import { OUTSTATIC_API_URL } from '@/utils/constants'
import { NextRequest, NextResponse } from 'next/server'
import { MagicLinkCallbackSchema, ExchangeTokenResponseSchema } from './schemas'
import { ZodError } from 'zod'

export default async function GET(request: NextRequest) {
  const basePath = (process.env.OST_BASE_PATH || '').replace(/\/+$/, '')
  const dashboardPath = `${basePath}/outstatic`

  try {
    const url = new URL(request.url)
    const queryParams = Object.fromEntries(url.searchParams.entries())

    // Validate query parameters with Zod
    const { exchange_token: exchangeToken } =
      MagicLinkCallbackSchema.parse(queryParams)

    // Exchange the one-time token for session tokens
    const apiBase = OUTSTATIC_API_URL?.endsWith('/')
      ? OUTSTATIC_API_URL
      : `${OUTSTATIC_API_URL ?? ''}/`

    const exchangeUrl = new URL('outstatic/auth/exchange-token', apiBase)

    const response = await fetch(exchangeUrl.href, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        exchange_token: exchangeToken,
        callback_url: url.origin + url.pathname
      })
    })

    if (!response.ok) {
      return NextResponse.redirect(
        new URL(`${dashboardPath}?error=invalid_token`, request.url)
      )
    }

    const responseData = await response.json()

    // Validate API response structure with Zod
    const {
      user,
      session: sessionData,
      return_url
    } = ExchangeTokenResponseSchema.parse(responseData)

    // Create LoginSession object compatible with existing GitHub flow
    const session: LoginSession = {
      user: {
        name: user.name || user.email,
        login: user.login || user.email,
        email: user.email,
        image: user.avatar_url || '',
        permissions: (user.permissions as AppPermissions[]) || []
      },
      provider: 'magic-link',
      access_token: sessionData.access_token,
      expires: new Date(sessionData.expires_at * 1000),
      refresh_token: sessionData.refresh_token,
      refresh_token_expires: resolveRefreshTokenExpiry(sessionData)
    }

    // Store session cookie
    await setLoginSession(session)

    // Redirect to return_url if provided, otherwise fallback to /outstatic
    const redirectUrl = return_url ?? new URL(dashboardPath, request.url).href

    // Validate it's a relative URL or same-origin
    const validatedUrl = new URL(redirectUrl, request.url)
    if (validatedUrl.origin !== new URL(request.url).origin) {
      throw new Error('Invalid redirect URL')
    }

    return NextResponse.redirect(validatedUrl)
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      console.error('Magic link callback validation error:', error.errors)
      return NextResponse.redirect(
        new URL(`${dashboardPath}?error=invalid_data`, request.url)
      )
    }

    // Log unexpected errors for debugging
    console.error('Magic link callback error:', error)

    return NextResponse.redirect(
      new URL(`${dashboardPath}?error=callback_error`, request.url)
    )
  }
}
