import { getLoginSession } from '@/utils/auth/auth'
import { OUTSTATIC_API_KEY, OUTSTATIC_API_URL } from '@/utils/constants'

/** Relays self-hosted scans without exposing a project API key to the browser. */
export default async function POST(request: Request): Promise<Response> {
  const session = await getLoginSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  if (!OUTSTATIC_API_KEY)
    return new Response('Repository discovery is not configured.', {
      status: 404
    })
  return fetch(`${OUTSTATIC_API_URL}/outstatic/scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OUTSTATIC_API_KEY}`
    },
    body: request.body,
    duplex: 'half'
  } as RequestInit)
}
