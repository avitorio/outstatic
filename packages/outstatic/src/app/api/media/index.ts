import { getLoginSession } from '@/utils/auth/auth'
import { REPO_MEDIA_PATH } from '@/utils/constants'
import { NextRequest, NextResponse } from 'next/server'

const MONOREPO_PATH = process.env.OST_MONOREPO_PATH

export default async function GET(
  req: NextRequest,
  res: NextResponse
): Promise<Response> {
  const session = await getLoginSession()
  const pathParts = req.nextUrl.pathname.split('/')
  const mediaIndex = pathParts.indexOf('media')

  if (mediaIndex === -1 || mediaIndex === pathParts.length - 1) {
    return new Response('Invalid media path', { status: 400 })
  }

  const [repoOwner, repoSlug, ...remainingParts] = pathParts.slice(
    mediaIndex + 1
  )
  const fileName = remainingParts.pop()
  const repoBranch = remainingParts.join('/')

  if (!repoSlug || !repoBranch || !fileName) {
    return new Response('Invalid media path format', { status: 400 })
  }

  if (session?.access_token) {
    const mediaUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoSlug}/${repoBranch}/${
      MONOREPO_PATH ? MONOREPO_PATH + '/' : ''
    }${REPO_MEDIA_PATH}${fileName.split('/').pop()}`
    console.log({ mediaUrl })
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
