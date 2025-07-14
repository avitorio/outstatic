import { clearLoginSession } from '@/utils/auth/auth'
import { NextRequest, NextResponse } from 'next/server'

export default async function GET(req: NextRequest) {
  await clearLoginSession()

  const homeUrl = new URL(process.env.OST_BASE_PATH || '/', req.url)
  return NextResponse.redirect(homeUrl)
}
