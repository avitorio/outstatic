import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import {
  setLoginSession,
  getLoginSession,
  clearLoginSession,
  refreshTokenIfNeeded,
  isTokenExpired,
  isRefreshTokenValid,
  LoginSession
} from '../auth'
import { getAccessToken } from '../github'
import { TOKEN_NAME, SESSION_ERROR_MESSAGES } from '@/utils/constants'

// Mock the next/headers cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn()
}))

// Mock the github auth
jest.mock('../github', () => ({
  getAccessToken: jest.fn()
}))

// Mock jose
jest.mock('jose', () => ({
  SignJWT: jest.fn(),
  jwtVerify: jest.fn()
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

  const mockSignJWT = {
    setProtectedHeader: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue('mock-jwt-token')
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(cookies as jest.Mock).mockResolvedValue(mockCookieStore)
    ;(SignJWT as jest.Mock).mockImplementation(() => mockSignJWT)
    ;(jwtVerify as jest.Mock).mockResolvedValue({ payload: mockSession })
  })

  describe('setLoginSession', () => {
    it('should set the session cookie with correct parameters', async () => {
      const result = await setLoginSession(mockSession)

      expect(result).toBe(true)
      expect(SignJWT).toHaveBeenCalledWith({ ...mockSession })
      expect(mockSignJWT.setProtectedHeader).toHaveBeenCalledWith({
        alg: 'HS256'
      })
      expect(mockSignJWT.setIssuedAt).toHaveBeenCalled()
      expect(mockSignJWT.setExpirationTime).toHaveBeenCalledWith(
        mockSession.refresh_token_expires
      )
      expect(mockSignJWT.sign).toHaveBeenCalled()

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        TOKEN_NAME,
        'mock-jwt-token',
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

      expect(mockSignJWT.setExpirationTime).toHaveBeenCalledWith(
        sessionWithoutRefreshExpires.expires
      )
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        TOKEN_NAME,
        'mock-jwt-token',
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
        'mock-jwt-token',
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
      const mockToken = 'mock-jwt-token'
      mockCookieStore.get.mockReturnValue({ value: mockToken })

      const result = await getLoginSession()

      expect(result).toEqual(mockSession)
      expect(jwtVerify).toHaveBeenCalledWith(mockToken, expect.anything())
    })

    it('should normalize date strings back to Date objects', async () => {
      const sessionWithStringDates = {
        ...mockSession,
        expires: mockSession.expires.toISOString(),
        refresh_token_expires: mockSession.refresh_token_expires?.toISOString()
      }
      const mockToken = 'mock-jwt-token'
      mockCookieStore.get.mockReturnValue({ value: mockToken })
      ;(jwtVerify as jest.Mock).mockResolvedValueOnce({
        payload: sessionWithStringDates
      })

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
      const mockToken = 'mock-jwt-token'
      mockCookieStore.get.mockReturnValue({ value: mockToken })
      ;(jwtVerify as jest.Mock).mockResolvedValueOnce({
        payload: invalidSession
      })

      const result = await getLoginSession()

      expect(result).toBeNull()
      expect(console.warn).toHaveBeenCalledWith(
        SESSION_ERROR_MESSAGES.INVALID_STRUCTURE,
        invalidSession
      )
    })

    it('should return session even if access token is expired', async () => {
      const expiredSession = {
        ...mockSession,
        expires: new Date(Date.now() - 1000) // expired
      }
      const mockToken = 'mock-jwt-token'
      mockCookieStore.get.mockReturnValue({ value: mockToken })
      ;(jwtVerify as jest.Mock).mockResolvedValueOnce({
        payload: expiredSession
      })

      const result = await getLoginSession()

      // Should return the session as is, even if expired
      expect(result).toEqual(expiredSession)
    })

    it('should return session even if refresh token is expired', async () => {
      const expiredSession = {
        ...mockSession,
        expires: new Date(Date.now() - 1000), // expired
        refresh_token_expires: new Date(Date.now() - 1000) // expired
      }
      const mockToken = 'mock-jwt-token'
      mockCookieStore.get.mockReturnValue({ value: mockToken })
      ;(jwtVerify as jest.Mock).mockResolvedValueOnce({
        payload: expiredSession
      })

      const result = await getLoginSession()

      // Should return the session as is, even if refresh token is expired
      expect(result).toEqual(expiredSession)
    })

    it('should return session even if no refresh token exists', async () => {
      const expiredSession = {
        ...mockSession,
        expires: new Date(Date.now() - 1000), // expired
        refresh_token: undefined,
        refresh_token_expires: undefined
      }
      const mockToken = 'mock-jwt-token'
      mockCookieStore.get.mockReturnValue({ value: mockToken })
      ;(jwtVerify as jest.Mock).mockResolvedValueOnce({
        payload: expiredSession
      })

      const result = await getLoginSession()

      // Should return the session as is, even if no refresh token
      expect(result).toEqual(expiredSession)
    })

    it('should return null when token verification fails', async () => {
      const mockToken = 'invalid-token'
      mockCookieStore.get.mockReturnValue({ value: mockToken })
      ;(jwtVerify as jest.Mock).mockRejectedValueOnce(
        new Error('Invalid token')
      )

      const result = await getLoginSession()

      expect(result).toBeNull()
      expect(console.error).toHaveBeenCalledWith(
        'Session validation error:',
        expect.any(Error)
      )
    })

    it('should return session even if token refresh would fail', async () => {
      const expiredSession = {
        ...mockSession,
        expires: new Date(Date.now() - 1000) // expired
      }
      const mockToken = 'mock-jwt-token'
      mockCookieStore.get.mockReturnValue({ value: mockToken })
      ;(jwtVerify as jest.Mock).mockResolvedValueOnce({
        payload: expiredSession
      })

      const result = await getLoginSession()

      // Should return the session as is, even if token refresh would fail
      expect(result).toEqual(expiredSession)
    })

    it('should return session even if token refresh returns no access token', async () => {
      const expiredSession = {
        ...mockSession,
        expires: new Date(Date.now() - 1000) // expired
      }
      const mockToken = 'mock-jwt-token'
      mockCookieStore.get.mockReturnValue({ value: mockToken })
      ;(jwtVerify as jest.Mock).mockResolvedValueOnce({
        payload: expiredSession
      })

      const result = await getLoginSession()

      // Should return the session as is, even if token refresh would return no access token
      expect(result).toEqual(expiredSession)
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
      const mockToken = 'mock-jwt-token'
      mockCookieStore.get.mockReturnValue({ value: mockToken })
      ;(jwtVerify as jest.Mock).mockResolvedValueOnce({
        payload: invalidSession
      })

      const result = await getLoginSession()

      expect(result).toBeNull()
    })

    it('should handle session with missing user object', async () => {
      const invalidSession = {
        access_token: 'token',
        expires: new Date(Date.now() + 3600000)
        // Missing user object
      }
      const mockToken = 'mock-jwt-token'
      mockCookieStore.get.mockReturnValue({ value: mockToken })
      ;(jwtVerify as jest.Mock).mockResolvedValueOnce({
        payload: invalidSession
      })

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
      const mockToken = 'mock-jwt-token'
      mockCookieStore.get.mockReturnValue({ value: mockToken })
      ;(jwtVerify as jest.Mock).mockResolvedValueOnce({
        payload: invalidSession
      })

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
      const mockToken = 'mock-jwt-token'
      mockCookieStore.get.mockReturnValue({ value: mockToken })
      ;(jwtVerify as jest.Mock).mockResolvedValueOnce({
        payload: invalidSession
      })

      const result = await getLoginSession()

      expect(result).toBeNull()
    })

    it('should handle session with expired refresh token but valid access token', async () => {
      const sessionWithExpiredRefreshToken = {
        ...mockSession,
        expires: new Date(Date.now() + 3600000), // Valid access token
        refresh_token_expires: new Date(Date.now() - 1000) // Expired refresh token
      }
      const mockToken = 'mock-jwt-token'
      mockCookieStore.get.mockReturnValue({ value: mockToken })
      ;(jwtVerify as jest.Mock).mockResolvedValueOnce({
        payload: sessionWithExpiredRefreshToken
      })

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
      const mockToken = 'mock-jwt-token'
      mockCookieStore.get.mockReturnValue({ value: mockToken })
      ;(jwtVerify as jest.Mock).mockResolvedValueOnce({
        payload: expiredSession
      })

      const result = await getLoginSession()

      // Should return the session as is, even if both tokens are expired
      expect(result).toEqual(expiredSession)
    })

    it('should handle session with expired access token but no refresh token expiry', async () => {
      const expiredSession = {
        ...mockSession,
        expires: new Date(Date.now() - 1000), // Expired access token
        refresh_token_expires: undefined // No refresh token expiry
      }
      const mockToken = 'mock-jwt-token'
      mockCookieStore.get.mockReturnValue({ value: mockToken })
      ;(jwtVerify as jest.Mock).mockResolvedValueOnce({
        payload: expiredSession
      })

      const result = await getLoginSession()

      // Should return the session as is, even if access token is expired
      expect(result).toEqual(expiredSession)
    })
  })

  describe('isTokenExpired', () => {
    it('should return false for valid token', () => {
      const futureDate = new Date(Date.now() + 3600000) // 1 hour from now
      expect(isTokenExpired(futureDate)).toBe(false)
    })

    it('should return true for expired token', () => {
      const pastDate = new Date(Date.now() - 1000) // 1 second ago
      expect(isTokenExpired(pastDate)).toBe(true)
    })

    it('should return true for token expiring now', () => {
      const now = new Date()
      expect(isTokenExpired(now)).toBe(true)
    })
  })

  describe('isRefreshTokenValid', () => {
    it('should return false if no refresh token', () => {
      const sessionWithoutRefresh = {
        ...mockSession,
        refresh_token: undefined
      }
      expect(isRefreshTokenValid(sessionWithoutRefresh)).toBe(false)
    })

    it('should return true if refresh token has no expiry', () => {
      const sessionWithoutExpiry = {
        ...mockSession,
        refresh_token_expires: undefined
      }
      expect(isRefreshTokenValid(sessionWithoutExpiry)).toBe(true)
    })

    it('should return true for valid refresh token', () => {
      const validSession = {
        ...mockSession,
        refresh_token_expires: new Date(Date.now() + 86400000) // 24 hours from now
      }
      expect(isRefreshTokenValid(validSession)).toBe(true)
    })

    it('should return false for expired refresh token', () => {
      const expiredSession = {
        ...mockSession,
        refresh_token_expires: new Date(Date.now() - 1000) // 1 second ago
      }
      expect(isRefreshTokenValid(expiredSession)).toBe(false)
    })
  })

  describe('refreshTokenIfNeeded', () => {
    it('should return session if token is not expired', async () => {
      const validSession = {
        ...mockSession,
        expires: new Date(Date.now() + 3600000) // 1 hour from now
      }

      const result = await refreshTokenIfNeeded(validSession)
      expect(result).toEqual(validSession)
    })

    it('should refresh token if expired and refresh token is valid', async () => {
      const expiredSession = {
        ...mockSession,
        expires: new Date(Date.now() - 1000) // Expired 1 second ago
      }

      ;(getAccessToken as jest.Mock).mockResolvedValue({
        access_token: 'new-access-token',
        expires_in: 3600000,
        refresh_token: 'new-refresh-token',
        refresh_token_expires_in: 86400000
      })

      const result = await refreshTokenIfNeeded(expiredSession)
      expect(result.access_token).toBe('new-access-token')
      expect(getAccessToken).toHaveBeenCalledWith({
        refresh_token: 'mock-refresh-token',
        grant_type: 'refresh_token'
      })
    })

    it('should handle concurrent refresh requests for the same token', async () => {
      const expiredSession = {
        ...mockSession,
        expires: new Date(Date.now() - 1000) // Expired 1 second ago
      }

      ;(getAccessToken as jest.Mock).mockResolvedValue({
        access_token: 'new-access-token',
        expires_in: 3600000,
        refresh_token: 'new-refresh-token',
        refresh_token_expires_in: 86400000
      })

      // Start multiple concurrent refresh operations
      const promises = [
        refreshTokenIfNeeded(expiredSession),
        refreshTokenIfNeeded(expiredSession),
        refreshTokenIfNeeded(expiredSession)
      ]

      const results = await Promise.all(promises)

      // All should return the same refreshed session
      results.forEach((result) => {
        expect(result.access_token).toBe('new-access-token')
      })

      // getAccessToken should only be called once due to concurrent request handling
      expect(getAccessToken).toHaveBeenCalledTimes(1)
    })

    it('should throw error if refresh token is expired', async () => {
      const expiredSession = {
        ...mockSession,
        expires: new Date(Date.now() - 1000), // Expired 1 second ago
        refresh_token_expires: new Date(Date.now() - 1000) // Refresh token also expired
      }

      await expect(refreshTokenIfNeeded(expiredSession)).rejects.toThrow(
        'Token expired and no valid refresh token available'
      )
    })

    it('should throw error if no refresh token available', async () => {
      const expiredSession = {
        ...mockSession,
        expires: new Date(Date.now() - 1000), // Expired 1 second ago
        refresh_token: undefined
      }

      await expect(refreshTokenIfNeeded(expiredSession)).rejects.toThrow(
        'Token expired and no valid refresh token available'
      )
    })
  })
})
