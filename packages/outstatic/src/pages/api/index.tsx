import { NextApiRequest, NextApiResponse } from 'next'
import { Session } from 'next-session/lib/types'
import callback from './auth/callback'
import login from './auth/login'
import signout from './auth/signout'
import user from './auth/user'
import images from './images'

interface Request extends NextApiRequest {
  session: Session
}

type QueryType = { ost: ['callback', 'login', 'signout', 'user', 'images'] }

const pages = {
  callback,
  login,
  signout,
  user,
  images
}

export const OutstaticApi = (req: Request, res: NextApiResponse) => {
  const { ost } = req.query as QueryType

  return pages[ost[0]](req, res)
}
