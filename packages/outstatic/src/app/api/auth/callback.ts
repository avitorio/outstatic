import { setLoginSession } from '@/utils/auth/auth'
import { getAccessToken, fetchGitHubUser } from '@/utils/auth/github'
import { NextRequest, NextResponse } from 'next/server'

export default async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const error = url.searchParams.get('error')

  // Handle GitHub errors
  if (error) {
    return NextResponse.json({ error }, { status: 403 })
  }

  const code = url.searchParams.get('code') as string | null
  if (!code) {
    return NextResponse.json({ error: 'missing_code' }, { status: 400 })
  }

  try {
    const {
      access_token,
      refresh_token,
      expires_in,
      refresh_token_expires_in
    } = await getAccessToken({ code })

    if (!access_token) {
      return NextResponse.json({ error: 'no_access_token' }, { status: 401 })
    }

    let userData = await fetchGitHubUser(access_token)

    // If email is missing, fetch from /user/emails
    if (!userData.email) {
      const emails = await (
        await fetch('https://api.github.com/user/emails', {
          headers: {
            Authorization: `token ${access_token}`
          }
        })
      ).json()

      if (Array.isArray(emails) && emails.length > 0) {
        const primary = emails.find((email: any) => email.primary)
        userData.email = primary ? primary.email : emails[0].email
      }
    }

    if (userData && userData.email && access_token) {
      const { name, login, email, avatar_url } = userData
      const sessionData = {
        user: { name, login, email, image: avatar_url },
        access_token,
        refresh_token,
        expires: new Date(Date.now() + expires_in),
        refresh_token_expires: refresh_token_expires_in
          ? new Date(Date.now() + refresh_token_expires_in)
          : undefined
      }
      await setLoginSession(sessionData)
      // Use absolute URL for redirect
      const origin = url.origin
      const redirectUrl =
        origin + (process.env.OST_BASE_PATH || '') + '/outstatic'
      return NextResponse.redirect(redirectUrl)
    } else {
      return NextResponse.json({ error: 'missing_user_data' }, { status: 403 })
    }
  } catch (err) {
    console.error('Auth callback error:', err)
    return NextResponse.json({ error: 'auth_callback_failed' }, { status: 500 })
  }
}
