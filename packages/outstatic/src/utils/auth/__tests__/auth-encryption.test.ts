/** @jest-environment node */

import { webcrypto } from 'node:crypto'
import { cookies } from 'next/headers'
import { getLoginSession, LoginSession, setLoginSession } from '../auth'

jest.mock('next/headers', () => ({
  cookies: jest.fn()
}))

jest.mock('../github', () => ({
  getAccessToken: jest.fn()
}))

const originalCrypto = Object.getOwnPropertyDescriptor(globalThis, 'crypto')

beforeAll(() => {
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: webcrypto
  })
})

afterAll(() => {
  if (originalCrypto) {
    Object.defineProperty(globalThis, 'crypto', originalCrypto)
  }
})

describe('encrypted sessions', () => {
  it('round trips a session using a compact JWE cookie', async () => {
    let cookieValue: string | undefined
    const cookieStore = {
      set: jest.fn((_name: string, value: string) => {
        cookieValue = value
      }),
      get: jest.fn(() =>
        cookieValue === undefined ? undefined : { value: cookieValue }
      )
    }
    ;(cookies as jest.Mock).mockResolvedValue(cookieStore)

    const session: LoginSession = {
      user: {
        name: 'Test User',
        login: 'test-user',
        email: 'test@example.com',
        image: 'https://example.com/avatar.png',
        permissions: ['content.manage']
      },
      provider: 'github',
      access_token: 'github-access-token',
      refresh_token: 'github-refresh-token',
      expires: new Date(Date.now() + 60 * 60 * 1000),
      refresh_token_expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }

    await expect(setLoginSession(session)).resolves.toBe(true)

    expect(cookieValue).toBeDefined()
    expect(cookieValue!.split('.')).toHaveLength(5)
    expect(new TextEncoder().encode(cookieValue).byteLength).toBeLessThan(4096)
    expect(cookieValue).not.toContain(session.access_token)

    await expect(getLoginSession()).resolves.toEqual(
      expect.objectContaining({
        ...session,
        exp: expect.any(Number),
        iat: expect.any(Number)
      })
    )
  })
})
