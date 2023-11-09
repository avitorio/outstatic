import { TOKEN_NAME } from '../../../utils/auth/auth-cookies'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export default async function GET(req: NextRequest) {
  cookies().set(TOKEN_NAME, '', {
    maxAge: -1,
    path: '/'
  })

  const homeUrl = new URL('/', req.url)
  return NextResponse.redirect(homeUrl)
}
