import { parse } from 'cookie'
import { Request } from './auth'
import { cookies } from 'next/headers'

export const TOKEN_NAME = 'ost_token'

export const MAX_AGE = 60 * 60 * 8 // 8 hours

export function setTokenCookie(token: string) {
  cookies().set(TOKEN_NAME, token, {
    maxAge: MAX_AGE,
    expires: new Date(Date.now() + MAX_AGE * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax'
  })
}

export function parseCookies(req: Request) {
  // For API Routes we don't need to parse the cookies.
  if (req.cookies) return req.cookies

  // For pages we do need to parse the cookies.
  const cookie = req.headers?.cookie
  return parse(cookie || '')
}

export function getTokenCookie(req: Request) {
  const cookies = parseCookies(req)
  return cookies[TOKEN_NAME]
}

export function removeTokenCookie() {
  cookies().set({ name: TOKEN_NAME, value: '', maxAge: 0 })
}
