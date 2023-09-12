import { TOKEN_NAME } from '../../../utils/auth/auth-cookies'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export default async function GET(req: NextRequest) {
  cookies().set(TOKEN_NAME, '', {
    maxAge: -1,
    path: '/'
  })

  const url = req.nextUrl.clone()
  url.pathname = '/outstatic'
  url.search = ''
  return NextResponse.redirect(url)
}
