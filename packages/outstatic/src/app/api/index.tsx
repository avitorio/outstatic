import callback from '@/app/api/auth/callback'
import login from '@/app/api/auth/login'
import signout from '@/app/api/auth/signout'
import user from '@/app/api/auth/user'
import generate from '@/app/api/generate'
import media from '@/app/api/media'
import { Session } from 'next-session/lib/types'
import { NextRequest } from 'next/server'

export interface Request extends NextRequest {
  session: Session
}

export type GetParams = Promise<{
  ost: ['callback', 'login', 'signout', 'user', 'media']
}>

export type PostParams = Promise<{
  ost: ['generate']
}>

const getPaths = {
  callback,
  login,
  signout,
  user,
  media
}

const postPaths = {
  generate
}

export const OutstaticApi = {
  GET: async (req: Request, segmentData: { params: GetParams }) => {
    const { ost } = await segmentData.params
    const rsp = getPaths[ost[0]](req)
    return rsp
  },
  POST: async (req: Request, segmentData: { params: PostParams }) => {
    const { ost } = await segmentData.params
    const rsp = postPaths[ost[0]](req)
    return rsp
  }
}
