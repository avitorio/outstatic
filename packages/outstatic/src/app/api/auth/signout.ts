import { clearLoginSession } from '@/utils/auth/auth'
import { NextRequest } from 'next/server'

function isSameOriginRequest(req: NextRequest) {
  const origin = req.headers.get('origin')
  if (!origin) return false

  try {
    return new URL(origin).origin === new URL(req.url).origin
  } catch {
    return false
  }
}

export default async function POST(req: NextRequest) {
  if (!isSameOriginRequest(req)) {
    return Response.json({ error: 'invalid-origin' }, { status: 403 })
  }

  await clearLoginSession()
  return new Response(null, { status: 204 })
}
