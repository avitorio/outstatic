import { NextRequest, NextResponse } from 'next/server'
import { Session } from 'next-session/lib/types'
import callback from './auth/callback'
import login from './auth/login'
import signout from './auth/signout'
import user from './auth/user'
import images from './images'

export interface Request extends NextRequest {
  session: Session
}

export type QueryType = {
  params: {
    ost: ['callback', 'login', 'signout', 'user', 'images']
  }
}

const pages = {
  callback,
  login,
  signout,
  user,
  images
}

export const OutstaticApi = {
  GET: async (req: Request, { params }: QueryType) => {
    const { ost } = params
    const rsp = pages[ost[0]](req)
    return rsp
  }
}
