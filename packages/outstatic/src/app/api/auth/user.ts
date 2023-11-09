import { getLoginSession } from '../../../utils/auth/auth'
import { NextResponse } from 'next/server'

export type Request = {
  cookies: Partial<{
    [key: string]: string
  }>
  headers: {
    cookie: string
  }
}

export default async function user() {
  try {
    const session = await getLoginSession()
    return NextResponse.json({ session })
  } catch (error) {
    return NextResponse.json({ error })
  }
}
