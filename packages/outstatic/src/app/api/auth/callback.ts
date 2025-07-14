import { setLoginSession } from '@/utils/auth/auth'
import { getAccessToken, fetchGitHubUser } from '@/utils/auth/github'
import { createEdgeRouter } from 'next-connect'
import nextSession from 'next-session'
import { NextRequest, NextResponse } from 'next/server'

interface Request extends NextRequest {
  session: Awaited<ReturnType<typeof getSession>>
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
  return router.run(request, { params: { id: '1' } }) as Promise<Response>
}

router
  .use(async (req, res, next) => {
    //@ts-ignore
    await getSession(req, res) // session is set to req.session
    const response = await next()
    if (response) {
      const url = req.nextUrl.clone()
      url.pathname = (process.env.OST_BASE_PATH || '') + '/outstatic'
      url.search = ''
      if (response.status !== 200) {
        const data = await response.json()
        url.searchParams.set('error', data.error)
      }
      return NextResponse.redirect(url)
    }
  })
  .get(async (req) => {
    const error = req?.nextUrl.searchParams?.get('error')

    // check for GitHub errors
    if (error) {
      return NextResponse.json({ error }, { status: 403 })
    }

    const code = req?.nextUrl.searchParams?.get('code') as string
    const {
      access_token,
      refresh_token,
      expires_in,
      refresh_token_expires_in
    } = await getAccessToken({ code })
    req.session.token = access_token
    req.session.refresh_token = refresh_token
    const userData = await fetchGitHubUser(access_token || '')

    // const checks = Promise.all([
    //   checkRepository(req.session.token, userData.login),
    //   checkCollaborator(req.session.token, userData.login)
    // ])

    // const [repoExists, isCollaborator] = await checks

    // if (!repoExists) {
    //   return NextResponse.json(
    //     { error: 'repository-not-found' },
    //     { status: 404, statusText: 'Repository not found' }
    //   )
    // }

    // if (!isCollaborator) {
    //   return NextResponse.json(
    //     { error: 'not-collaborator' },
    //     { status: 403, statusText: 'Forbidden' }
    //   )
    // }

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

      const sessionData = {
        user: { name, login, email, image: avatar_url },
        access_token,
        refresh_token: refresh_token,
        expires: new Date(Date.now() + expires_in),
        refresh_token_expires: refresh_token_expires_in
          ? new Date(Date.now() + refresh_token_expires_in)
          : undefined
      }

      await setLoginSession(sessionData)
      return new NextResponse('ok', { status: 200 })
    } else {
      console.error('Missing user data or access token:', {
        userData,
        access_token
      })
      return NextResponse.json({ error: 'something' }, { status: 403 })
    }
  })
