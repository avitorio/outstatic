import { NextApiRequest, NextApiResponse } from 'next'
import { createRouter } from 'next-connect'
const router = createRouter<NextApiRequest, NextApiResponse>()

router.get(async (_, res) => {
  res.redirect(
    `https://github.com/login/oauth/authorize?client_id=${process.env.OST_GITHUB_ID}&redirect_uri%3Dhttp%253A%252F%252Flocalhost%253A3000%252Fapi%252Fauth%252Fcallback%26response_type%3Dcode%26scope%3Drepo%252Cuser`
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
