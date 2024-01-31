import callback from '@/app/api/auth/callback'
import login from '@/app/api/auth/login'
import signout from '@/app/api/auth/signout'
import user from '@/app/api/auth/user'
import generate from '@/app/api/generate'
import images from '@/app/api/images'
import { Session } from 'next-session/lib/types'
import { NextRequest } from 'next/server'

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
