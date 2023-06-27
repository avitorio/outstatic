import { NextApiRequest, NextApiResponse } from 'next'
import { createRouter } from 'next-connect'
const router = createRouter<NextApiRequest, NextApiResponse>()

router.get(async (_, res) => {
  res.redirect(
    `https://github.com/login/oauth/authorize?client_id=${process.env.OST_GITHUB_ID}&scope=repo%2C%20user&response_type=code`
  )
})

export default router.handler({
  onError: (_, __, res) => {
    res.status(500).end('Something broke 2!')
  },
  onNoMatch: (_, res) => {
    res.status(404).end('Page is not found')
  }
})
