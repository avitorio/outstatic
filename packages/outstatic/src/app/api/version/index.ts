import { getLoginSession } from '@/utils/auth/auth'
import { OUTSTATIC_APP_URL, OUTSTATIC_VERSION } from '@/utils/constants'

const CACHE_CONTROL = 'private, max-age=86400'

/**
 * Checks the hosted version endpoint without forwarding any browser headers or
 * self-hosted deployment details.
 */
export default async function GET(): Promise<Response> {
  const session = await getLoginSession()

  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }

  const baseUrl = OUTSTATIC_APP_URL.replace(/\/$/, '')
  const params = new URLSearchParams({ version: OUTSTATIC_VERSION })

  try {
    const response = await fetch(
      `${baseUrl}/api/outstatic/version?${params.toString()}`,
      {
        cache: 'no-store',
        headers: { Accept: 'application/json' }
      }
    )
    const headers = new Headers({
      'Cache-Control': response.ok ? CACHE_CONTROL : 'no-store'
    })
    const contentType = response.headers.get('content-type')

    if (contentType) {
      headers.set('Content-Type', contentType)
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    })
  } catch {
    return new Response(
      JSON.stringify({
        error: 'Unable to check the latest Outstatic version.'
      }),
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store',
          'Content-Type': 'application/json'
        }
      }
    )
  }
}
