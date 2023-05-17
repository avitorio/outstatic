import { cookies } from 'next/headers'
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

export default async function user(req: Request, res: Response) {
  try {
    const session = await getLoginSession(req)
    return NextResponse.json({ session })
  } catch (error) {
    return NextResponse.json({ error })
  }
}
