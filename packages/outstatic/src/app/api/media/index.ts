import { getLoginSession } from '@/utils/auth/auth'
import type { Request } from '@/app/api/index'
import { OST_PRO_API_URL } from '@/utils/constants'

export default async function GET(req: Request): Promise<Response> {
  const session = await getLoginSession()
  const pathParts = req.nextUrl.pathname.split('/')
  const mediaIndex = pathParts.indexOf('media')

  if (mediaIndex === -1 || mediaIndex === pathParts.length - 1) {
    return new Response('Invalid media path', { status: 400 })
  }

  const mediaPath = pathParts.slice(mediaIndex + 1).join('/')

  // Check if OST_PRO_API_KEY is set - if so, use the proxy mode
  const ostProApiKey = process.env.OST_PRO_API_KEY

  if (ostProApiKey && session?.provider !== 'github') {
    // Proxy mode: forward request to the main app's API with authentication
    const session = await getLoginSession()

    if (!session?.access_token) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Just pass the media path - the API will lookup the project from repo owner/slug
    const proxyUrl = `${OST_PRO_API_URL}/outstatic/media/${mediaPath}`

    try {
      const response = await fetch(proxyUrl, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Referer': req.headers.get('referer') || req.nextUrl.href
        }
      })

      if (response.status === 200 && response.body) {
        const contentType = response.headers.get('Content-Type')
        const content =
          contentType === 'image/svg+xml'
            ? await response.blob()
            : Buffer.from(await response.arrayBuffer())

        return new Response(content, {
          status: 200,
          headers: { 'Cache-Control': 'max-age=300' }
        })
      }

      return new Response(response.statusText, {
        status: response.status
      })
    } catch (error) {
      console.error('Error proxying media request:', error)
      return new Response('Failed to fetch media', { status: 500 })
    }
  }

  // Legacy mode: fetch directly from GitHub using user's access token
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
