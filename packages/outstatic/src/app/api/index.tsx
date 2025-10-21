import callback from '@/app/api/auth/callback'
import login from '@/app/api/auth/login'
import signout from '@/app/api/auth/signout'
import user from '@/app/api/auth/user'
import generate from '@/app/api/generate'
import media from '@/app/api/media'
import { NextRequest } from 'next/server'

export type GetParams = Promise<{
  ost?: string[]
}>

export type PostParams = Promise<{
  ost?: string[]
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
  GET: async (req: NextRequest, segmentData: { params: GetParams }) => {
    const { ost } = await segmentData.params
    if (!ost || ost.length === 0) {
      return new Response('Invalid path', { status: 400 })
    }
    const handler = getPaths[ost[0] as keyof typeof getPaths]
    if (!handler) {
      return new Response('Not found', { status: 404 })
    }
    const rsp = handler(req)
    return rsp
  },
  POST: async (req: NextRequest, segmentData: { params: PostParams }) => {
    const { ost } = await segmentData.params
    if (!ost || ost.length === 0) {
      return new Response('Invalid path', { status: 400 })
    }
    const handler = postPaths[ost[0] as keyof typeof postPaths]
    if (!handler) {
      return new Response('Not found', { status: 404 })
    }
    const rsp = handler(req)
    return rsp
  }
}
