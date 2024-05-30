import { TOKEN_NAME } from '@/utils/auth/auth'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export default async function GET(req: NextRequest) {
  cookies().set(TOKEN_NAME, '', {
    maxAge: -1,
    path: '/'
  })

  const homeUrl = new URL(process.env.OST_BASE_PATH || '/', req.url)
  return NextResponse.redirect(homeUrl)
}
