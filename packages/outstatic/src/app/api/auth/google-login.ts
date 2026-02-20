import { OUTSTATIC_API_KEY, OUTSTATIC_API_URL } from '@/utils/constants'
import { NextRequest } from 'next/server'
import { GoogleLoginRequestSchema } from './schemas'
import { ZodError } from 'zod'

type GoogleRelayErrorCode =
  | 'invalid-api-key'
  | 'project-url-not-configured'
  | 'invalid-callback-domain'
  | 'invalid-callback-target'
  | 'google-relay-failed'

function parseRelayError(payload: unknown): GoogleRelayErrorCode {
  if (!payload || typeof payload !== 'object') {
    return 'google-relay-failed'
  }

  const error = (payload as { error?: string }).error

  if (
    error === 'invalid-api-key' ||
    error === 'project-url-not-configured' ||
    error === 'invalid-callback-domain' ||
    error === 'invalid-callback-target'
  ) {
    return error
  }

  return 'google-relay-failed'
}

export default async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const parsedBody = rawBody ? JSON.parse(rawBody) : {}

    const { returnUrl } = GoogleLoginRequestSchema.parse(parsedBody)

    if (!OUTSTATIC_API_KEY) {
      return Response.json({ error: 'auth-not-configured' }, { status: 400 })
    }

    const url = new URL(request.url)
    const baseUrl = `${url.protocol}//${url.host}`
    const basePath = (process.env.OST_BASE_PATH || '').replace(/\/+$/, '')
    const callbackUrl = `${baseUrl}${basePath}/api/outstatic/callback`
    const effectiveReturnUrl = returnUrl ?? `${baseUrl}${basePath}/outstatic`

    const apiBase = OUTSTATIC_API_URL?.endsWith('/')
      ? OUTSTATIC_API_URL
      : `${OUTSTATIC_API_URL ?? ''}/`
    const requestUrl = new URL('outstatic/auth/google-exchange', apiBase)

    const response = await fetch(requestUrl.href, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OUTSTATIC_API_KEY}`
      },
      body: JSON.stringify({
        callbackUrl,
        returnUrl: effectiveReturnUrl
      })
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => null)
      const error = parseRelayError(payload)

      return Response.json({ error }, { status: response.status })
    }

    const data = await response.json().catch(() => null)
    if (!data || typeof data.url !== 'string') {
      return Response.json({ error: 'google-relay-failed' }, { status: 500 })
    }

    return Response.json({ url: data.url })
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0]
      return Response.json(
        { error: firstError?.message || 'Invalid request data' },
        { status: 400 }
      )
    }

    return Response.json({ error: 'google-relay-failed' }, { status: 500 })
  }
}
