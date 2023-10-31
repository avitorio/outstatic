import { Session } from 'next-session/lib/types'
import { NextRequest } from 'next/server'
import callback from './auth/callback'
import login from './auth/login'
import signout from './auth/signout'
import user from './auth/user'
import generate from './generate'
import images from './images'

export interface Request extends NextRequest {
  session: Session
}

export type GetParams = {
  params: {
    ost: ['callback', 'login', 'signout', 'user', 'images']
  }
}

export type PostParams = {
  params: {
    ost: ['generate']
  }
}

const getPaths = {
  callback,
  login,
  signout,
  user,
  images
}

const postPaths = {
  generate
}

export const OutstaticApi = {
  GET: async (req: Request, { params }: GetParams) => {
    const { ost } = params
    const rsp = getPaths[ost[0]](req)
    return rsp
  },
  POST: async (req: Request, { params }: PostParams) => {
    const { ost } = params
    const rsp = postPaths[ost[0]](req)
    return rsp
  }
}
