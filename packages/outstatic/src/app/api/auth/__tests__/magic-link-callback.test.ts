import {
  createNextRequest,
  ensureWebApiGlobals,
  getLocationHeader,
  jsonResponse,
  ORIGINAL_ENV,
  resetEnv
} from '../test-helpers'

type MagicLinkRouteSetup = {
  magicLinkCallbackRoute: (request: Request) => Promise<Response>
  setLoginSessionMock: jest.Mock
}

async function setupMagicLinkRoute(
  envOverrides: Record<string, string | undefined> = {}
): Promise<MagicLinkRouteSetup> {
  jest.resetModules()
  ensureWebApiGlobals()

  resetEnv({
    OUTSTATIC_API_URL: 'https://outstatic.com/api',
    ...envOverrides
  })

  jest.doMock('@/utils/auth/auth', () => ({
    setLoginSession: jest.fn(),
    resolveRefreshTokenExpiry: jest.fn((session) => {
      if (session?.refresh_token_expires_at) {
        return new Date(session.refresh_token_expires_at * 1000)
      }

      return session?.refresh_token_expires_in
        ? new Date(Date.now() + session.refresh_token_expires_in)
        : undefined
    })
  }))

  const { default: magicLinkCallbackRoute } =
    await import('../magic-link-callback')
  const authModule = await import('@/utils/auth/auth')

  return {
    magicLinkCallbackRoute: magicLinkCallbackRoute as unknown as (
      request: Request
    ) => Promise<Response>,
    setLoginSessionMock: authModule.setLoginSession as unknown as jest.Mock
  }
}

describe('/api/outstatic/magic-link-callback', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
  })

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  it('creates a session and redirects to same-origin return_url', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({
        user: {
          email: 'member@example.com',
          login: 'member-login',
          name: 'Member User',
          avatar_url: 'https://example.com/avatar.png',
          permissions: ['content.manage']
        },
        session: {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          expires_at: 2_000_000_000,
          refresh_token_expires_at: 2_100_000_000
        },
        return_url: 'https://self-host.dev/outstatic/collections'
      })
    )

    const { magicLinkCallbackRoute, setLoginSessionMock } =
      await setupMagicLinkRoute()

    const response = await magicLinkCallbackRoute(
      createNextRequest(
        'https://self-host.dev/api/outstatic/magic-link-callback?exchange_token=exchange-123'
      )
    )

    expect(response.status).toBe(307)
    expect(getLocationHeader(response)).toBe(
      'https://self-host.dev/outstatic/collections'
    )
    expect(setLoginSessionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'magic-link',
        refresh_token_expires: new Date(2_100_000_000 * 1000),
        user: expect.objectContaining({
          login: 'member-login',
          email: 'member@example.com'
        })
      })
    )
    expect(global.fetch).toHaveBeenCalledWith(
      'https://outstatic.com/api/outstatic/auth/exchange-token',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          exchange_token: 'exchange-123',
          callback_url:
            'https://self-host.dev/api/outstatic/magic-link-callback'
        })
      })
    )
  })

  it('falls back to user email when login is missing', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({
        user: {
          email: 'fallback@example.com',
          login: null,
          name: 'Fallback User',
          avatar_url: '',
          permissions: []
        },
        session: {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          expires_at: 2_000_000_000
        }
      })
    )

    const { magicLinkCallbackRoute, setLoginSessionMock } =
      await setupMagicLinkRoute()

    const response = await magicLinkCallbackRoute(
      createNextRequest(
        'https://self-host.dev/api/outstatic/magic-link-callback?exchange_token=exchange-456'
      )
    )

    expect(response.status).toBe(307)
    expect(setLoginSessionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.objectContaining({
          login: 'fallback@example.com'
        })
      })
    )
  })

  it('rejects cross-origin return_url values', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({
        user: {
          email: 'member@example.com',
          login: 'member-login',
          name: 'Member User',
          avatar_url: '',
          permissions: []
        },
        session: {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          expires_at: 2_000_000_000
        },
        return_url: 'https://evil.example.com/phish'
      })
    )

    const { magicLinkCallbackRoute, setLoginSessionMock } =
      await setupMagicLinkRoute()

    const response = await magicLinkCallbackRoute(
      createNextRequest(
        'https://self-host.dev/api/outstatic/magic-link-callback?exchange_token=exchange-789'
      )
    )

    expect(response.status).toBe(307)
    expect(getLocationHeader(response)).toBe(
      'https://self-host.dev/outstatic?error=callback_error'
    )
    expect(setLoginSessionMock).toHaveBeenCalledTimes(1)
  })

  it('redirects with invalid_data for malformed exchange payloads', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({
        user: {
          email: 'member@example.com'
        }
      })
    )

    const { magicLinkCallbackRoute, setLoginSessionMock } =
      await setupMagicLinkRoute()

    const response = await magicLinkCallbackRoute(
      createNextRequest(
        'https://self-host.dev/api/outstatic/magic-link-callback?exchange_token=exchange-000'
      )
    )

    expect(response.status).toBe(307)
    expect(getLocationHeader(response)).toBe(
      'https://self-host.dev/outstatic?error=invalid_data'
    )
    expect(setLoginSessionMock).not.toHaveBeenCalled()
  })
})
