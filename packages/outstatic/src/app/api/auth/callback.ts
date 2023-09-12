import { NextFetchEvent, NextRequest, NextResponse } from 'next/server'
import { createEdgeRouter } from 'next-connect'
import { redirect } from 'next/navigation'
import nextSession from 'next-session'
import { Session } from 'next-session/lib/types'
import { setLoginSession } from '../../../utils/auth/auth'
import { MAX_AGE } from '../../../utils/auth/auth-cookies'

interface Request extends NextRequest {
  session: Session
}

interface RequestContext {
  params: {
    id: string
  }
}

interface RequestContext {
  params: {
    id: string
  }
}

const router = createEdgeRouter<Request, RequestContext>()
const getSession = nextSession()

export default async function GET(request: Request) {
  return router.run(request, { params: { id: '1' } })
}

async function getAccessToken(code: string) {
  const request = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      client_id: process.env.OST_GITHUB_ID,
      client_secret: process.env.OST_GITHUB_SECRET,
      code
    })
  })
  const text = await request.text()
  const params = new URLSearchParams(text)
  return params.get('access_token')
}

async function fetchGitHubUser(token: string) {
  const request = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: 'token ' + token
    }
  })
  return await request.json()
}

router
  .use(async (req, res, next) => {
    //@ts-ignore
    await getSession(req, res) // session is set to req.session
    const response = await next()
    if (response) {
      const url = req.nextUrl.clone()
      url.pathname = '/outstatic'
      url.search = ''
      return NextResponse.redirect(url)
    }
  })
  .get(async (req, res) => {
    const code = req?.nextUrl.searchParams?.get('code') as string
    const access_token = await getAccessToken(code)
    req.session.token = access_token
    const userData = await fetchGitHubUser(access_token || '')

    if (!userData.email) {
      const emails = await (
        await fetch('https://api.github.com/user/emails', {
          headers: {
            Authorization: `token ${access_token}`
          }
        })
      ).json()

      if ((emails === null || emails === void 0 ? void 0 : emails.length) > 0) {
        var _emails$find

        userData.email =
          (_emails$find = emails.find(
            (email: { primary: string }) => email.primary
          )) === null || _emails$find === void 0
            ? void 0
            : _emails$find.email
        if (!userData.email) userData.email = emails[0].email
      }
    }

    if (userData && access_token) {
      const { name, login, email, avatar_url } = userData
      await setLoginSession({
        user: { name, login, email, image: avatar_url },
        access_token,
        expires: new Date(Date.now() + MAX_AGE * 1000)
      })
      return true
    } else {
      return new NextResponse('Something brokez!', {
        status: 404
      })
    }
  })
