import * as Iron from '@hapi/iron'
import { cookies } from 'next/headers'
import {
  setLoginSession,
  getLoginSession,
  clearLoginSession,
  LoginSession
} from '../auth'
import { getAccessToken } from '../github'
import {
  TOKEN_NAME,
  TOKEN_SECRET,
  SESSION_ERROR_MESSAGES
} from '@/utils/constants'

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

// Mock console methods to avoid noise in tests
const originalConsole = { ...console }
beforeAll(() => {
  console.warn = jest.fn()
  console.error = jest.fn()
  console.log = jest.fn()
})

afterAll(() => {
  console.warn = originalConsole.warn
  console.error = originalConsole.error
  console.log = originalConsole.log
})

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
      const result = await setLoginSession(mockSession)

      expect(result).toBe(true)
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

    it('should use expires date when refresh_token_expires is not provided', async () => {
      const sessionWithoutRefreshExpires = {
        ...mockSession,
        refresh_token_expires: undefined
      }

      await setLoginSession(sessionWithoutRefreshExpires)

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        TOKEN_NAME,
        'mock-sealed-token',
        expect.objectContaining({
          expires: sessionWithoutRefreshExpires.expires
        })
      )
    })

    it('should throw error for invalid session data', async () => {
      const invalidSession = {
        ...mockSession,
        access_token: undefined // Invalid: missing access_token
      }

      await expect(setLoginSession(invalidSession as any)).rejects.toThrow(
        SESSION_ERROR_MESSAGES.INVALID_SESSION
      )
    })

    it('should throw error for session with invalid date', async () => {
      const invalidSession = {
        ...mockSession,
        expires: 'invalid-date' as any
      }

      await expect(setLoginSession(invalidSession)).rejects.toThrow(
        SESSION_ERROR_MESSAGES.INVALID_SESSION
      )
    })

    it('should handle maxAge calculation correctly when refresh token expires before access token', async () => {
      const sessionWithEarlierRefreshExpiry = {
        ...mockSession,
        expires: new Date(Date.now() + 7200000), // 2 hours from now
        refresh_token_expires: new Date(Date.now() + 3600000) // 1 hour from now
      }

      await setLoginSession(sessionWithEarlierRefreshExpiry)

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        TOKEN_NAME,
        'mock-sealed-token',
        expect.objectContaining({
          expires: sessionWithEarlierRefreshExpiry.refresh_token_expires
        })
      )
    })
  })

  describe('getLoginSession', () => {
    it('should return null when no token exists', async () => {
      mockCookieStore.get.mockReturnValue({ value: undefined })

      const result = await getLoginSession()

      expect(result).toBeNull()
      expect(console.log).toHaveBeenCalledWith('No token found in cookies')
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

    it('should normalize date strings back to Date objects', async () => {
      const sessionWithStringDates = {
        ...mockSession,
        expires: mockSession.expires.toISOString(),
        refresh_token_expires: mockSession.refresh_token_expires?.toISOString()
      }
      const mockToken = 'mock-sealed-token'
      mockCookieStore.get.mockReturnValue({ value: mockToken })
      ;(Iron.unseal as jest.Mock).mockResolvedValueOnce(sessionWithStringDates)

      const result = await getLoginSession()

      expect(result).toEqual(mockSession)
      expect(result?.expires).toBeInstanceOf(Date)
      expect(result?.refresh_token_expires).toBeInstanceOf(Date)
    })

    it('should return null when session structure is invalid', async () => {
      const invalidSession = {
        user: {
          name: 'Test User',
          login: 'testuser',
          email: 'test@example.com',
          image: 'https://example.com/avatar.jpg'
        },
        // Missing access_token
        expires: new Date(Date.now() + 3600000)
      }
      const mockToken = 'mock-sealed-token'
      mockCookieStore.get.mockReturnValue({ value: mockToken })
      ;(Iron.unseal as jest.Mock).mockResolvedValueOnce(invalidSession)

      const result = await getLoginSession()

      expect(result).toBeNull()
      expect(console.warn).toHaveBeenCalledWith(
        SESSION_ERROR_MESSAGES.INVALID_STRUCTURE,
        invalidSession
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

      // Should save the updated session
      expect(Iron.seal).toHaveBeenCalled()
      expect(mockCookieStore.set).toHaveBeenCalled()
    })

    it('should handle token refresh when no new refresh token is provided', async () => {
      const expiredSession = {
        ...mockSession,
        expires: new Date(Date.now() - 1000) // expired
      }
      const mockToken = 'mock-sealed-token'
      mockCookieStore.get.mockReturnValue({ value: mockToken })
      ;(Iron.unseal as jest.Mock).mockResolvedValueOnce(expiredSession)
      ;(getAccessToken as jest.Mock).mockResolvedValueOnce({
        access_token: 'new-access-token',
        expires_in: 3600
        // No refresh_token in response
      })

      const result = await getLoginSession()

      expect(result).toEqual(
        expect.objectContaining({
          access_token: 'new-access-token',
          refresh_token: expiredSession.refresh_token, // Should keep old refresh token
          expires: expect.any(Date)
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

    it('should return null when session is expired and no refresh token exists', async () => {
      const expiredSession = {
        ...mockSession,
        expires: new Date(Date.now() - 1000), // expired
        refresh_token: undefined,
        refresh_token_expires: undefined
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
      expect(console.error).toHaveBeenCalledWith(
        'Session validation error:',
        expect.any(Error)
      )
    })

    it('should return null when token refresh fails', async () => {
      const expiredSession = {
        ...mockSession,
        expires: new Date(Date.now() - 1000) // expired
      }
      const mockToken = 'mock-sealed-token'
      mockCookieStore.get.mockReturnValue({ value: mockToken })
      ;(Iron.unseal as jest.Mock).mockResolvedValueOnce(expiredSession)
      ;(getAccessToken as jest.Mock).mockRejectedValueOnce(
        new Error('Refresh failed')
      )

      const result = await getLoginSession()

      expect(result).toBeNull()
      expect(console.error).toHaveBeenCalledWith(
        'Failed to refresh token:',
        expect.any(Error)
      )
    })

    it('should return null when token refresh returns no access token', async () => {
      const expiredSession = {
        ...mockSession,
        expires: new Date(Date.now() - 1000) // expired
      }
      const mockToken = 'mock-sealed-token'
      mockCookieStore.get.mockReturnValue({ value: mockToken })
      ;(Iron.unseal as jest.Mock).mockResolvedValueOnce(expiredSession)
      ;(getAccessToken as jest.Mock).mockResolvedValueOnce({
        // No access_token in response
        expires_in: 3600
      })

      const result = await getLoginSession()

      expect(result).toBeNull()
    })
  })

  describe('clearLoginSession', () => {
    it('should clear the session cookie', async () => {
      await clearLoginSession()

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        TOKEN_NAME,
        '',
        expect.objectContaining({
          maxAge: -1,
          httpOnly: true,
          secure: expect.any(Boolean),
          path: '/',
          sameSite: 'lax'
        })
      )
    })
  })

  describe('Session validation edge cases', () => {
    it('should handle session with null values', async () => {
      const invalidSession = null
      const mockToken = 'mock-sealed-token'
      mockCookieStore.get.mockReturnValue({ value: mockToken })
      ;(Iron.unseal as jest.Mock).mockResolvedValueOnce(invalidSession)

      const result = await getLoginSession()

      expect(result).toBeNull()
    })

    it('should handle session with missing user object', async () => {
      const invalidSession = {
        access_token: 'token',
        expires: new Date(Date.now() + 3600000)
        // Missing user object
      }
      const mockToken = 'mock-sealed-token'
      mockCookieStore.get.mockReturnValue({ value: mockToken })
      ;(Iron.unseal as jest.Mock).mockResolvedValueOnce(invalidSession)

      const result = await getLoginSession()

      expect(result).toBeNull()
    })

    it('should handle session with invalid user properties', async () => {
      const invalidSession = {
        user: {
          name: 123, // Invalid: should be string
          login: 'testuser',
          email: 'test@example.com',
          image: 'https://example.com/avatar.jpg'
        },
        access_token: 'token',
        expires: new Date(Date.now() + 3600000)
      }
      const mockToken = 'mock-sealed-token'
      mockCookieStore.get.mockReturnValue({ value: mockToken })
      ;(Iron.unseal as jest.Mock).mockResolvedValueOnce(invalidSession)

      const result = await getLoginSession()

      expect(result).toBeNull()
    })

    it('should handle session with invalid access token type', async () => {
      const invalidSession = {
        user: {
          name: 'Test User',
          login: 'testuser',
          email: 'test@example.com',
          image: 'https://example.com/avatar.jpg'
        },
        access_token: 123, // Invalid: should be string
        expires: new Date(Date.now() + 3600000)
      }
      const mockToken = 'mock-sealed-token'
      mockCookieStore.get.mockReturnValue({ value: mockToken })
      ;(Iron.unseal as jest.Mock).mockResolvedValueOnce(invalidSession)

      const result = await getLoginSession()

      expect(result).toBeNull()
    })

    it('should handle session with expired refresh token but valid access token', async () => {
      const sessionWithExpiredRefreshToken = {
        ...mockSession,
        expires: new Date(Date.now() + 3600000), // Valid access token
        refresh_token_expires: new Date(Date.now() - 1000) // Expired refresh token
      }
      const mockToken = 'mock-sealed-token'
      mockCookieStore.get.mockReturnValue({ value: mockToken })
      ;(Iron.unseal as jest.Mock).mockResolvedValueOnce(
        sessionWithExpiredRefreshToken
      )

      const result = await getLoginSession()

      // Should return the session since access token is still valid
      expect(result).toEqual(sessionWithExpiredRefreshToken)
    })

    it('should handle session with expired access token and expired refresh token', async () => {
      const expiredSession = {
        ...mockSession,
        expires: new Date(Date.now() - 1000), // Expired access token
        refresh_token_expires: new Date(Date.now() - 1000) // Expired refresh token
      }
      const mockToken = 'mock-sealed-token'
      mockCookieStore.get.mockReturnValue({ value: mockToken })
      ;(Iron.unseal as jest.Mock).mockResolvedValueOnce(expiredSession)

      const result = await getLoginSession()

      expect(result).toBeNull()
    })

    it('should handle session with expired access token but no refresh token expiry', async () => {
      const expiredSession = {
        ...mockSession,
        expires: new Date(Date.now() - 1000), // Expired access token
        refresh_token_expires: undefined // No refresh token expiry
      }
      const mockToken = 'mock-sealed-token'
      mockCookieStore.get.mockReturnValue({ value: mockToken })
      ;(Iron.unseal as jest.Mock).mockResolvedValueOnce(expiredSession)

      const newAccessToken = 'new-access-token'
      ;(getAccessToken as jest.Mock).mockResolvedValueOnce({
        access_token: newAccessToken,
        expires_in: 3600
      })

      const result = await getLoginSession()

      expect(result).toEqual(
        expect.objectContaining({
          access_token: newAccessToken,
          expires: expect.any(Date)
        })
      )
    })
  })
})
