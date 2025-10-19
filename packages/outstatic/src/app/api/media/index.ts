import { getLoginSession } from '@/utils/auth/auth'
import type { Request } from '@/app/api/index'

export default async function GET(req: Request): Promise<Response> {
  const session = await getLoginSession()
  const pathParts = req.nextUrl.pathname.split('/')
  const mediaIndex = pathParts.indexOf('media')

  if (mediaIndex === -1 || mediaIndex === pathParts.length - 1) {
    return new Response('Invalid media path', { status: 400 })
  }

  const mediaPath = pathParts.slice(mediaIndex + 1).join('/')

  if (session?.access_token) {
    const mediaUrl = `https://raw.githubusercontent.com/${mediaPath}`

    const response = await fetch(mediaUrl, {
      headers: {
        authorization: `token ${session.access_token}`
      }
    })
    if (response.status === 200 && response.body) {
      const contentType = response.headers.get('Content-Type')
      const content =
        contentType === 'image/svg+xml'
          ? await response.blob()
          : Buffer.from(await response.arrayBuffer())

      const newHeaders = new Headers(req.headers)
      // Add a new header
      newHeaders.set('Cache-Control', 'max-age=300')

      return new Response(content, {
        status: 200,
        headers: { 'Cache-Control': 'max-age=300' }
      })
    }
    return new Response(response.statusText, {
      status: response.status
    })
  } else {
    return new Response('Unauthorized', {
      status: 401
    })
  }
}
