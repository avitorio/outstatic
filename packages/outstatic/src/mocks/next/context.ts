import { LoginSession } from '@/utils/auth/auth'
import hm from 'node-mocks-http'
import { createMockRequest } from './request'

export const createMockContext = async (
  req: hm.RequestOptions,
  res: hm.ResponseOptions,
  session?: LoginSession
) => {
  const rq = await createMockRequest(req, session)
  const rs = hm.createResponse(res)
  const query = req.query ?? {}
  const resolvedUrl = req.url ?? ''
  return {
    req: rq,
    res: rs,
    query,
    resolvedUrl
  }
}
