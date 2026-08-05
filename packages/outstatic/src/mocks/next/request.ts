import { LoginSession } from '@/utils/auth/auth'
import { getSessionKey } from '@/utils/auth/session-key'
import { EncryptJWT } from 'jose'
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

  const token = await new EncryptJWT({ ...sesh })
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setExpirationTime(sesh.refresh_token_expires ?? sesh.expires)
    .encrypt(await getSessionKey())

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
