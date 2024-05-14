import { getLoginSession } from '@/utils/auth/auth'

export type Request = {
  cookies: Partial<{
    [key: string]: string
  }>
  headers: {
    cookie: string
  }
}

export default async function user(): Promise<Response> {
  try {
    const session = await getLoginSession()
    return Response.json({ session })
  } catch (error) {
    return Response.json({ error })
  }
}
