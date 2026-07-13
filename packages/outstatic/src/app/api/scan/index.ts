import { getLoginSession } from '@/utils/auth/auth'
import { OUTSTATIC_API_KEY, OUTSTATIC_API_URL } from '@/utils/constants'

/**
 * Relays self-hosted scans without exposing a project API key to the browser.
 * The upstream scan service verifies that this project API key is bound to the
 * client-supplied projectId before performing the scan.
 */
export default async function POST(request: Request): Promise<Response> {
  const session = await getLoginSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  if (!OUTSTATIC_API_KEY)
    return new Response('Repository discovery is not configured.', {
      status: 404
    })
  const timeout =
    typeof AbortSignal.timeout === 'function'
      ? AbortSignal.timeout(30_000)
      : undefined
  const response = await fetch(`${OUTSTATIC_API_URL}/outstatic/scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OUTSTATIC_API_KEY}`
    },
    body: request.body,
    duplex: 'half',
    signal: timeout
  } as RequestInit)

  const headers = new Headers()
  const contentType = response.headers.get('content-type')
  if (contentType) headers.set('content-type', contentType)

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  })
}
