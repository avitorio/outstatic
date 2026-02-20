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

type GoogleLoginErrorCode = GoogleRelayErrorCode | 'auth-not-configured'

type GoogleLoginResult =
  | {
      ok: true
      url: string
    }
  | {
      ok: false
      error: GoogleLoginErrorCode
      status: number
      returnUrl: string
    }

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

function buildUrls(request: NextRequest, returnUrl?: string) {
  const url = new URL(request.url)
  const baseUrl = `${url.protocol}//${url.host}`
  const basePath = (process.env.OST_BASE_PATH || '').replace(/\/+$/, '')
  const callbackUrl = `${baseUrl}${basePath}/api/outstatic/callback`
  const defaultReturnUrl = `${baseUrl}${basePath}/outstatic`
  const effectiveReturnUrl = returnUrl ?? defaultReturnUrl

  return {
    callbackUrl,
    effectiveReturnUrl
  }
}

async function startGoogleLogin(
  request: NextRequest,
  returnUrl?: string
): Promise<GoogleLoginResult> {
  const { callbackUrl, effectiveReturnUrl } = buildUrls(request, returnUrl)

  if (!OUTSTATIC_API_KEY) {
    return {
      ok: false,
      error: 'auth-not-configured',
      status: 400,
      returnUrl: effectiveReturnUrl
    }
  }

  const apiBase = OUTSTATIC_API_URL?.endsWith('/')
    ? OUTSTATIC_API_URL
    : `${OUTSTATIC_API_URL ?? ''}/`
  const requestUrl = new URL('outstatic/auth/google-exchange', apiBase)

  try {
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

      return {
        ok: false,
        error,
        status: response.status,
        returnUrl: effectiveReturnUrl
      }
    }

    const data = await response.json().catch(() => null)
    if (!data || typeof data.url !== 'string') {
      return {
        ok: false,
        error: 'google-relay-failed',
        status: 500,
        returnUrl: effectiveReturnUrl
      }
    }

    return { ok: true, url: data.url }
  } catch {
    return {
      ok: false,
      error: 'google-relay-failed',
      status: 500,
      returnUrl: effectiveReturnUrl
    }
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const parsedReturnUrl = GoogleLoginRequestSchema.safeParse({
    returnUrl: url.searchParams.get('returnUrl') ?? undefined
  })
  const returnUrl = parsedReturnUrl.success
    ? parsedReturnUrl.data.returnUrl
    : undefined

  const result = await startGoogleLogin(request, returnUrl)
  if (!result.ok) {
    const destination = new URL(result.returnUrl)
    destination.searchParams.set('error', result.error)
    return new Response(null, {
      status: 302,
      headers: {
        Location: destination.toString()
      }
    })
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: result.url
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const parsedBody = rawBody ? JSON.parse(rawBody) : {}

    const { returnUrl } = GoogleLoginRequestSchema.parse(parsedBody)

    const result = await startGoogleLogin(request, returnUrl)
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: result.status })
    }

    return Response.json({ url: result.url })
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

export default POST
