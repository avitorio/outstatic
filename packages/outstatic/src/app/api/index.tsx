import callback from '@/app/api/auth/callback'
import login from '@/app/api/auth/login'
import signout from '@/app/api/auth/signout'
import user from '@/app/api/auth/user'
import magicLink from '@/app/api/auth/magic-link'
import magicLinkCallback from '@/app/api/auth/magic-link-callback'
import {
  GET as googleLoginGet,
  POST as googleLoginPost
} from '@/app/api/auth/google-login'
import refresh from '@/app/api/auth/refresh'
import generate from '@/app/api/generate'
import media from '@/app/api/media'
import { GET as githubGet, POST as githubPost } from '@/app/api/github'
import { NextRequest } from 'next/server'

export interface Request extends NextRequest {
  session?: unknown
  remainingPath?: string[]
}

// Updated to support nested routing with remaining path segments
export type GetParams = Promise<{
  ost?: string[]
}>

export type PostParams = Promise<{
  ost?: string[]
}>

// Handler function type that matches existing handlers
type RouteHandler = (req: Request) => Promise<Response>

const getPaths: Record<string, RouteHandler> = {
  callback,
  login,
  signout,
  user,
  media,
  github: githubGet,
  'magic-link-callback': magicLinkCallback,
  'google-login': googleLoginGet
} as any

const postPaths: Record<string, RouteHandler> = {
  generate,
  github: githubPost,
  'magic-link': magicLink,
  'google-login': googleLoginPost,
  refresh
} as any

export const OutstaticApi = {
  GET: async (
    req: globalThis.Request,
    segmentData: { params: GetParams }
  ): Promise<Response> => {
    const { ost = [] } = await segmentData.params
    const [firstSegment, ...remainingSegments] = ost

    const handler = getPaths[firstSegment]
    if (!handler) {
      return new Response('Not Found', { status: 404 })
    }

    // Add remaining path to request object for handlers that need it
    const extendedReq = req as Request
    extendedReq.remainingPath = remainingSegments

    return handler(extendedReq)
  },
  POST: async (
    req: globalThis.Request,
    segmentData: { params: PostParams }
  ): Promise<Response> => {
    const { ost = [] } = await segmentData.params
    const [firstSegment, ...remainingSegments] = ost

    const handler = postPaths[firstSegment]
    if (!handler) {
      return new Response('Not Found', { status: 404 })
    }

    // Add remaining path to request object for handlers that need it
    const extendedReq = req as Request
    extendedReq.remainingPath = remainingSegments

    return handler(extendedReq)
  }
}
