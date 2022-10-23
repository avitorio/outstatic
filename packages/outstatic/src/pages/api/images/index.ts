import { NextApiRequest, NextApiResponse } from 'next'
import { getLoginSession } from '../../../utils/auth/auth'

const REPO_SLUG = process.env.OST_REPO_SLUG || process.env.VERCEL_GIT_REPO_SLUG
const REPO_BRANCH = process.env.OST_REPO_BRANCH || 'main'
const MONOREPO_PATH = process.env.OST_MONOREPO_PATH

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getLoginSession(req)

  if (session?.access_token) {
    const response = await fetch(
      `https://raw.githubusercontent.com/${
        session?.user?.login
      }/${REPO_SLUG}/${REPO_BRANCH}/${
        MONOREPO_PATH ? MONOREPO_PATH + '/' : ''
      }public/images/${req.query?.ost?.[1]}`,
      {
        headers: {
          authorization: `token ${session.access_token}`
        }
      }
    )
    if (response.status === 200 && response.body) {
      const buffer = Buffer.from(await response.arrayBuffer())
      res.setHeader('Cache-Control', 'max-age=300')
      res.status(200).send(buffer)
      return
    }

    res.status(response.status).send(response.statusText)
  } else {
    res.status(401)
    res.end()
  }
}
