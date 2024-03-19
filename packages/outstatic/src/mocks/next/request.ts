import { LoginSession } from '@/utils/auth/auth'
import * as Iron from '@hapi/iron'
import hm from 'node-mocks-http'

export const createMockRequest = async (
  options: hm.RequestOptions,
  session?: LoginSession
) => {
  // create a session, required to generate an apollo client
  const future = new Date()
  future.setDate(future.getDate() + 3)
  const sesh: LoginSession = {
    user: {
      name: 'test',
      login: 'test@example.com',
      email: 'test@example.com',
      image: '',
      ...session?.user
    },
    access_token: 'access-token-test',
    expires: future,
    ...session
  }

  // see auth.ts
  const token = await Iron.seal(
    sesh,
    process.env.OST_TOKEN_SECRET || 'l1f3154n4dv3ntur3st4yS7r0n9s3cr3t',
    Iron.defaults
  )

  // create mock next.js objects for SSP
  const req = hm.createRequest({
    ...options,
    cookies: {
      ost_token: token,
      ...options.cookies
    }
  })

  return req
}
