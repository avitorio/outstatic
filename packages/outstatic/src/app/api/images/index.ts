import { NextRequest, NextResponse } from 'next/server'
import { getLoginSession } from '../../../utils/auth/auth'
import { IMAGES_PATH } from '../../../utils/constants'

const REPO_SLUG = process.env.OST_REPO_SLUG || process.env.VERCEL_GIT_REPO_SLUG
const REPO_BRANCH = process.env.OST_REPO_BRANCH || 'main'
const MONOREPO_PATH = process.env.OST_MONOREPO_PATH

export default async function GET(req: NextRequest, res: NextResponse) {
  const session = await getLoginSession()

  const REPO_OWNER = process.env.OST_REPO_OWNER || session?.user?.login

  if (session?.access_token) {
    const response = await fetch(
      `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_SLUG}/${REPO_BRANCH}/${
        MONOREPO_PATH ? MONOREPO_PATH + '/' : ''
      }public/${IMAGES_PATH}${req.nextUrl.pathname.split('/').pop()}`,
      {
        headers: {
          authorization: `token ${session.access_token}`
        }
      }
    )
    if (response.status === 200 && response.body) {
      const buffer = Buffer.from(await response.arrayBuffer())
      const newHeaders = new Headers(req.headers)
      // Add a new header
      newHeaders.set('Cache-Control', 'max-age=300')

      return new Response(buffer, {
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
