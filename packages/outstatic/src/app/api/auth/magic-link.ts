import { OST_PRO_API_KEY, OST_PRO_API_URL } from '@/utils/constants'
import { NextRequest, NextResponse } from 'next/server'
import { MagicLinkRequestSchema } from './schemas'
import { ZodError } from 'zod'

export default async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body with Zod
    const { email } = MagicLinkRequestSchema.parse(body)

    // Check if API key is configured
    if (!OST_PRO_API_KEY) {
      return NextResponse.json(
        { error: 'Email authentication is not configured' },
        { status: 500 }
      )
    }

    // Build callback URL for this site's magic-link/callback route
    const url = new URL(request.url)
    const baseUrl = `${url.protocol}//${url.host}`
    const callbackUrl = `${baseUrl}/api/outstatic/magic-link-callback`

    const apiBase =
      (OST_PRO_API_URL?.endsWith('/') ? OST_PRO_API_URL : `${OST_PRO_API_URL ?? ''}/`)
    const requestUrl = new URL(
      'outstatic/auth/request-magic-link',
      apiBase,
    )
    // Call apps/api endpoint with API key in Authorization header
    const response = await fetch(requestUrl.href, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OST_PRO_API_KEY}`,
      },
      body: JSON.stringify({
        email,
        callbackUrl,
      }),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to send magic link' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      const firstError = error.errors[0]
      return NextResponse.json(
        { error: firstError?.message || 'Invalid request data' },
        { status: 400 }
      )
    }

    // Log unexpected errors for debugging
    console.error('Magic link request error:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
