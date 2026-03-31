import { OUTSTATIC_API_KEY, OUTSTATIC_API_URL } from '@/utils/constants'
import { NextRequest } from 'next/server'

type LoginErrorCode =
  | 'auth-not-configured'
  | 'invalid-api-key'
  | 'project-url-not-configured'
  | 'invalid-callback-domain'
  | 'invalid-callback-target'
  | 'github-relay-failed'

function parseRelayError(payload: unknown): LoginErrorCode {
  if (!payload || typeof payload !== 'object') {
    return 'github-relay-failed'
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

  return 'github-relay-failed'
}

export default async function GET(request: NextRequest): Promise<Response> {
  const hasLocalGithubOAuth =
    !!process.env.OST_GITHUB_ID && !!process.env.OST_GITHUB_SECRET

  if (hasLocalGithubOAuth) {
    const scopes = ['read:user', 'user:email', 'repo']

    const url = new URL('https://github.com/login/oauth/authorize')

    url.searchParams.append('client_id', process.env.OST_GITHUB_ID ?? '')
    url.searchParams.append('scope', scopes.join(','))
    url.searchParams.append('response_type', 'code')
    if (process.env?.OST_GITHUB_CALLBACK_URL) {
      url.searchParams.append(
        'redirect_uri',
        process.env.OST_GITHUB_CALLBACK_URL
      )
    }

    return Response.json({ url: url.toString() })
  }

  if (!OUTSTATIC_API_KEY) {
    return Response.json({ error: 'auth-not-configured' }, { status: 400 })
  }

  try {
    const origin = new URL(request.url).origin
    const basePath = (process.env.OST_BASE_PATH || '').replace(/\/+$/, '')
    const callbackUrl = `${origin}${basePath}/api/outstatic/callback`

    const apiBase = OUTSTATIC_API_URL?.endsWith('/')
      ? OUTSTATIC_API_URL
      : `${OUTSTATIC_API_URL ?? ''}/`

    const relayUrl = new URL('outstatic/auth/github-exchange', apiBase)

    const response = await fetch(relayUrl.href, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OUTSTATIC_API_KEY}`
      },
      body: JSON.stringify({
        callback_url: callbackUrl
      })
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => null)
      const error = parseRelayError(payload)

      return Response.json({ error }, { status: response.status })
    }

    const data = await response.json().catch(() => null)
    if (!data || typeof data.url !== 'string') {
      return Response.json({ error: 'github-relay-failed' }, { status: 500 })
    }

    return Response.json({ url: data.url })
  } catch {
    return Response.json({ error: 'github-relay-failed' }, { status: 500 })
  }
}
