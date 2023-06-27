import { NextApiRequest, NextApiResponse } from 'next'
import { Session } from 'next-session/lib/types'
import images from './images'

interface Request extends NextApiRequest {
  session: Session
}

type QueryType = { ost: ['images'] }

const pages = {
  images
}

export const OutstaticApi = (req: Request, res: NextApiResponse) => {
  const { ost } = req.query as QueryType

  return pages[ost[0]](req, res)
}
