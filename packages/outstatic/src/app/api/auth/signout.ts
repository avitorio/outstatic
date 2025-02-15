import { TOKEN_NAME } from '@/utils/constants'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export default async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  cookieStore.set(TOKEN_NAME, '', {
    maxAge: -1,
    path: '/'
  })

  const homeUrl = new URL(process.env.OST_BASE_PATH || '/', req.url)
  return NextResponse.redirect(homeUrl)
}
