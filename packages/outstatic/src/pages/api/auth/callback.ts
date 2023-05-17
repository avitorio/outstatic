import { NextApiRequest, NextApiResponse } from 'next'
import { createRouter } from 'next-connect'
import nextSession from 'next-session'
import { Session } from 'next-session/lib/types'
import { setLoginSession } from '../../../utils/auth/auth'
import { MAX_AGE } from '../../../utils/auth/auth-cookies'

interface Request extends NextApiRequest {
  session: Session
}

const router = createRouter<Request, NextApiResponse>()
const getSession = nextSession()

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
    await getSession(req, res) // session is set to req.session
    await next()
  })
  .get(async (req, res) => {
    const code = req?.query?.code as string
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
      res.redirect('/outstatic') // or to wherever you want to redirect to after logging in
    } else {
      res.send('Login did not succeed!')
    }
  })

export default router.handler({
  onError: (err, _, res) => {
    console.error(err)
    res.status(500).end('Something broke!')
  },
  onNoMatch: (_, res) => {
    res.status(404).end('Page is not found')
  }
})
