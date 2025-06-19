import * as Iron from '@hapi/iron'
import { cookies } from 'next/headers'
import { setLoginSession, getLoginSession, LoginSession } from '../auth'
import { getAccessToken } from '../github'
import { TOKEN_NAME, TOKEN_SECRET } from '@/utils/constants'

// Mock the next/headers cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn()
}))

// Mock the github auth
jest.mock('../github', () => ({
  getAccessToken: jest.fn()
}))

// Mock Iron
jest.mock('@hapi/iron', () => ({
  seal: jest.fn(),
  unseal: jest.fn(),
  defaults: {
    encryption: {
      algorithm: 'aes-256-cbc',
      iterations: 1,
      minPasswordlength: 32,
      saltBits: 256
    },
    integrity: {
      algorithm: 'sha256',
      iterations: 1,
      minPasswordlength: 32,
      saltBits: 256
    },
    localtimeOffsetMsec: 0,
    timestampSkewSec: 60,
    ttl: 0
  }
}))

describe('Auth Utils', () => {
  const mockCookieStore = {
    set: jest.fn(),
    get: jest.fn()
  }

  const mockSession: LoginSession = {
    user: {
      name: 'Test User',
      login: 'testuser',
      email: 'test@example.com',
      image: 'https://example.com/avatar.jpg'
    },
    access_token: 'mock-access-token',
    expires: new Date(Date.now() + 3600000), // 1 hour from now
    refresh_token: 'mock-refresh-token',
    refresh_token_expires: new Date(Date.now() + 86400000) // 24 hours from now
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(cookies as jest.Mock).mockResolvedValue(mockCookieStore)
    ;(Iron.seal as jest.Mock).mockResolvedValue('mock-sealed-token')
    ;(Iron.unseal as jest.Mock).mockResolvedValue(mockSession)
  })

  describe('setLoginSession', () => {
    it('should set the session cookie with correct parameters', async () => {
      await setLoginSession(mockSession)

      expect(Iron.seal).toHaveBeenCalledWith(
        mockSession,
        TOKEN_SECRET,
        Iron.defaults
      )

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        TOKEN_NAME,
        'mock-sealed-token',
        expect.objectContaining({
          maxAge: expect.any(Number),
          expires: mockSession.refresh_token_expires,
          httpOnly: true,
          secure: expect.any(Boolean),
          path: '/',
          sameSite: 'lax'
        })
      )
    })
  })

  describe('getLoginSession', () => {
    it('should return null when no token exists', async () => {
      mockCookieStore.get.mockReturnValue({ value: undefined })

      const result = await getLoginSession()

      expect(result).toBeNull()
    })

    it('should return session when token is valid and not expired', async () => {
      const mockToken = 'mock-sealed-token'
      mockCookieStore.get.mockReturnValue({ value: mockToken })

      const result = await getLoginSession()

      expect(result).toEqual(mockSession)
      expect(Iron.unseal).toHaveBeenCalledWith(
        mockToken,
        TOKEN_SECRET,
        Iron.defaults
      )
    })

    it('should refresh token when access token is expired but refresh token is valid', async () => {
      const expiredSession = {
        ...mockSession,
        expires: new Date(Date.now() - 1000) // expired
      }
      const mockToken = 'mock-sealed-token'
      mockCookieStore.get.mockReturnValue({ value: mockToken })
      ;(Iron.unseal as jest.Mock).mockResolvedValueOnce(expiredSession)

      const newAccessToken = 'new-access-token'
      const newRefreshToken = 'new-refresh-token'
      ;(getAccessToken as jest.Mock).mockResolvedValueOnce({
        access_token: newAccessToken,
        expires_in: 3600,
        refresh_token: newRefreshToken,
        refresh_token_expires_in: 86400
      })

      const result = await getLoginSession()

      expect(getAccessToken).toHaveBeenCalledWith({
        refresh_token: expiredSession.refresh_token,
        grant_type: 'refresh_token'
      })

      expect(result).toEqual(
        expect.objectContaining({
          access_token: newAccessToken,
          refresh_token: newRefreshToken,
          expires: expect.any(Date),
          refresh_token_expires: expect.any(Date)
        })
      )
    })

    it('should return null when session is expired and refresh token is invalid', async () => {
      const expiredSession = {
        ...mockSession,
        expires: new Date(Date.now() - 1000), // expired
        refresh_token_expires: new Date(Date.now() - 1000) // expired
      }
      const mockToken = 'mock-sealed-token'
      mockCookieStore.get.mockReturnValue({ value: mockToken })
      ;(Iron.unseal as jest.Mock).mockResolvedValueOnce(expiredSession)

      const result = await getLoginSession()

      expect(result).toBeNull()
    })

    it('should return null when token unsealing fails', async () => {
      const mockToken = 'invalid-token'
      mockCookieStore.get.mockReturnValue({ value: mockToken })
      ;(Iron.unseal as jest.Mock).mockRejectedValueOnce(
        new Error('Invalid token')
      )

      const result = await getLoginSession()

      expect(result).toBeNull()
    })
  })
})
