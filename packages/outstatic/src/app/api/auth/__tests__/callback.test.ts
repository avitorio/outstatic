import {
  createNextRequest,
  ensureWebApiGlobals,
  getLocationHeader,
  jsonResponse,
  ORIGINAL_ENV,
  resetEnv
} from '../test-helpers'

type CallbackRouteSetup = {
  callbackRoute: (request: Request) => Promise<Response>
  setLoginSessionMock: jest.Mock
  getAccessTokenMock: jest.Mock
  fetchGitHubUserMock: jest.Mock
  checkCollaboratorMock: jest.Mock
  checkCollaboratorWithRepoMock: jest.Mock
}

async function setupCallbackRoute(
  envOverrides: Record<string, string | undefined>
): Promise<CallbackRouteSetup> {
  jest.resetModules()
  ensureWebApiGlobals()

  resetEnv({
    OST_BASE_PATH: '',
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

  jest.doMock('@/utils/auth/github', () => ({
    getAccessToken: jest.fn(),
    fetchGitHubUser: jest.fn(),
    checkCollaborator: jest.fn(),
    checkCollaboratorWithRepo: jest.fn()
  }))

  const { default: callbackRoute } = await import('../callback')
  const authModule = await import('@/utils/auth/auth')
  const githubModule = await import('@/utils/auth/github')

  return {
    callbackRoute: callbackRoute as unknown as (
      request: Request
    ) => Promise<Response>,
    setLoginSessionMock: authModule.setLoginSession as unknown as jest.Mock,
    getAccessTokenMock: githubModule.getAccessToken as unknown as jest.Mock,
    fetchGitHubUserMock: githubModule.fetchGitHubUser as unknown as jest.Mock,
    checkCollaboratorMock:
      githubModule.checkCollaborator as unknown as jest.Mock,
    checkCollaboratorWithRepoMock:
      githubModule.checkCollaboratorWithRepo as unknown as jest.Mock
  }
}

describe('/api/outstatic/callback', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
  })

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  it('passes query error through to dashboard redirect', async () => {
    const { callbackRoute } = await setupCallbackRoute({
      OST_BASE_PATH: '/cms'
    })

    const response = await callbackRoute(
      createNextRequest(
        'https://self-host.dev/cms/api/outstatic/callback?error=invalid-api-key'
      )
    )

    expect(response.status).toBe(307)
    expect(getLocationHeader(response)).toBe(
      'https://self-host.dev/cms/outstatic?error=invalid-api-key'
    )
  })

  it('handles exchange_token callback and stores magic-link session', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({
        user: {
          id: 'user-id',
          email: 'test@example.com',
          login: 'github-login',
          name: 'Test User',
          avatar_url: 'https://example.com/avatar.png',
          permissions: ['content.manage']
        },
        session: {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          expires_at: 2000000000,
          refresh_token_expires_at: 2100000000
        }
      })
    )

    const { callbackRoute, setLoginSessionMock } = await setupCallbackRoute({
      OST_BASE_PATH: '/cms'
    })

    const response = await callbackRoute(
      createNextRequest(
        'https://self-host.dev/cms/api/outstatic/callback?exchange_token=exchange-123'
      )
    )

    expect(response.status).toBe(307)
    expect(getLocationHeader(response)).toBe(
      'https://self-host.dev/cms/outstatic'
    )
    expect(global.fetch).toHaveBeenCalledWith(
      'https://outstatic.com/api/outstatic/auth/exchange-token',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          exchange_token: 'exchange-123',
          callback_url: 'https://self-host.dev/cms/api/outstatic/callback'
        })
      })
    )
    expect(setLoginSessionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'magic-link',
        refresh_token_expires: new Date(2100000000 * 1000),
        user: expect.objectContaining({
          login: 'github-login',
          email: 'test@example.com'
        })
      })
    )
  })

  it('falls back to email when exchange payload has no user.login', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({
        user: {
          id: 'user-id',
          email: 'fallback@example.com',
          name: 'Fallback User',
          avatar_url: '',
          permissions: []
        },
        session: {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          expires_at: 2000000000
        }
      })
    )

    const { callbackRoute, setLoginSessionMock } = await setupCallbackRoute({})

    const response = await callbackRoute(
      createNextRequest(
        'https://self-host.dev/api/outstatic/callback?exchange_token=exchange-456'
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

  it('redirects to session-error when exchange_token exchange fails', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse(
        {
          error: 'invalid_exchange'
        },
        { status: 401 }
      )
    )

    const { callbackRoute, setLoginSessionMock } = await setupCallbackRoute({})

    const response = await callbackRoute(
      createNextRequest(
        'https://self-host.dev/api/outstatic/callback?exchange_token=bad-token'
      )
    )

    expect(response.status).toBe(307)
    expect(getLocationHeader(response)).toBe(
      'https://self-host.dev/outstatic?error=session-error'
    )
    expect(setLoginSessionMock).not.toHaveBeenCalled()
  })

  it('keeps collaborator flow on provider github', async () => {
    const {
      callbackRoute,
      setLoginSessionMock,
      getAccessTokenMock,
      fetchGitHubUserMock,
      checkCollaboratorMock
    } = await setupCallbackRoute({
      OUTSTATIC_API_KEY: undefined
    })

    getAccessTokenMock.mockResolvedValue({
      access_token: 'github-access-token',
      refresh_token: 'github-refresh-token',
      expires_in: 3600_000,
      refresh_token_expires_in: 7200_000
    })
    fetchGitHubUserMock.mockResolvedValue({
      name: 'GitHub User',
      login: 'gh-user',
      email: 'github@example.com',
      avatar_url: 'https://example.com/gh-avatar.png'
    })
    checkCollaboratorMock.mockResolvedValue(true)

    const response = await callbackRoute(
      createNextRequest('https://self-host.dev/api/outstatic/callback?code=abc')
    )

    expect(response.status).toBe(307)
    expect(getLocationHeader(response)).toBe('https://self-host.dev/outstatic')
    expect(setLoginSessionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'github',
        access_token: 'github-access-token',
        user: expect.objectContaining({
          login: 'gh-user',
          email: 'github@example.com'
        })
      })
    )
  })

  it('redirects non-collaborators without pro key', async () => {
    const {
      callbackRoute,
      setLoginSessionMock,
      getAccessTokenMock,
      fetchGitHubUserMock,
      checkCollaboratorMock
    } = await setupCallbackRoute({
      OUTSTATIC_API_KEY: undefined
    })

    getAccessTokenMock.mockResolvedValue({
      access_token: 'github-access-token',
      expires_in: 3600_000
    })
    fetchGitHubUserMock.mockResolvedValue({
      name: 'GitHub User',
      login: 'gh-user',
      email: 'github@example.com',
      avatar_url: ''
    })
    checkCollaboratorMock.mockResolvedValue(false)

    const response = await callbackRoute(
      createNextRequest('https://self-host.dev/api/outstatic/callback?code=abc')
    )

    expect(response.status).toBe(307)
    expect(getLocationHeader(response)).toBe(
      'https://self-host.dev/outstatic?error=not-collaborator'
    )
    expect(setLoginSessionMock).not.toHaveBeenCalled()
  })

  it('creates magic-link session for validated non-collaborators with pro key', async () => {
    ;(global.fetch as jest.Mock).mockImplementation(
      async (input: URL | string) => {
        const url = input.toString()

        if (url === 'https://outstatic.com/api/outstatic/project') {
          return jsonResponse({
            repo_owner: 'outstatic',
            repo_slug: 'repo'
          })
        }

        if (
          url ===
          'https://outstatic.com/api/outstatic/auth/validate-github-user'
        ) {
          return jsonResponse({
            valid: true,
            exchange_token: 'relay-token',
            user: {
              name: 'Relay User',
              login: 'relay-login',
              avatar_url: 'https://example.com/relay.png'
            }
          })
        }

        if (url === 'https://outstatic.com/api/outstatic/auth/exchange-token') {
          return jsonResponse({
            user: {
              id: 'user-id',
              email: 'relay@example.com',
              login: 'exchange-login',
              name: 'Exchange Name',
              avatar_url: 'https://example.com/exchange.png',
              permissions: ['content.manage']
            },
            session: {
              access_token: 'relay-access-token',
              refresh_token: 'relay-refresh-token',
              expires_at: 2000000000,
              refresh_token_expires_at: 2100000000
            }
          })
        }

        throw new Error(`Unexpected fetch URL: ${url}`)
      }
    )

    const {
      callbackRoute,
      setLoginSessionMock,
      getAccessTokenMock,
      fetchGitHubUserMock,
      checkCollaboratorWithRepoMock
    } = await setupCallbackRoute({
      OUTSTATIC_API_KEY: 'pro-key'
    })

    getAccessTokenMock.mockResolvedValue({
      access_token: 'github-access-token',
      expires_in: 3600_000
    })
    fetchGitHubUserMock.mockResolvedValue({
      name: 'GitHub User',
      login: 'gh-user',
      email: 'github@example.com',
      avatar_url: ''
    })
    checkCollaboratorWithRepoMock.mockResolvedValue(false)

    const response = await callbackRoute(
      createNextRequest('https://self-host.dev/api/outstatic/callback?code=abc')
    )

    expect(response.status).toBe(307)
    expect(getLocationHeader(response)).toBe('https://self-host.dev/outstatic')
    expect(setLoginSessionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'magic-link',
        access_token: 'relay-access-token',
        refresh_token_expires: new Date(2100000000 * 1000),
        user: expect.objectContaining({
          login: 'relay-login',
          email: 'relay@example.com'
        })
      })
    )

    const validateCall = (global.fetch as jest.Mock).mock.calls.find((call) =>
      call[0]
        .toString()
        .includes(
          'https://outstatic.com/api/outstatic/auth/validate-github-user'
        )
    )

    const validatePayload = JSON.parse(validateCall?.[1]?.body ?? '{}')
    expect(validatePayload).toMatchObject({
      github_token: 'github-access-token',
      callback_url: 'https://self-host.dev/api/outstatic/callback'
    })
  })

  it('redirects to not-collaborator when SaaS validate call fails', async () => {
    ;(global.fetch as jest.Mock).mockImplementation(
      async (input: URL | string) => {
        const url = input.toString()

        if (url === 'https://outstatic.com/api/outstatic/project') {
          return jsonResponse({
            repo_owner: 'outstatic',
            repo_slug: 'repo'
          })
        }

        if (
          url ===
          'https://outstatic.com/api/outstatic/auth/validate-github-user'
        ) {
          return jsonResponse(
            {
              valid: false
            },
            { status: 403 }
          )
        }

        throw new Error(`Unexpected fetch URL: ${url}`)
      }
    )

    const {
      callbackRoute,
      getAccessTokenMock,
      fetchGitHubUserMock,
      checkCollaboratorWithRepoMock
    } = await setupCallbackRoute({
      OUTSTATIC_API_KEY: 'pro-key'
    })

    getAccessTokenMock.mockResolvedValue({
      access_token: 'github-access-token',
      expires_in: 3600_000
    })
    fetchGitHubUserMock.mockResolvedValue({
      name: 'GitHub User',
      login: 'gh-user',
      email: 'github@example.com',
      avatar_url: ''
    })
    checkCollaboratorWithRepoMock.mockResolvedValue(false)

    const response = await callbackRoute(
      createNextRequest('https://self-host.dev/api/outstatic/callback?code=abc')
    )

    expect(response.status).toBe(307)
    expect(getLocationHeader(response)).toBe(
      'https://self-host.dev/outstatic?error=not-collaborator'
    )
  })

  it('redirects to session-error when validate succeeds but exchange fails', async () => {
    ;(global.fetch as jest.Mock).mockImplementation(
      async (input: URL | string) => {
        const url = input.toString()

        if (url === 'https://outstatic.com/api/outstatic/project') {
          return jsonResponse({
            repo_owner: 'outstatic',
            repo_slug: 'repo'
          })
        }

        if (
          url ===
          'https://outstatic.com/api/outstatic/auth/validate-github-user'
        ) {
          return jsonResponse({
            valid: true,
            exchange_token: 'relay-token',
            user: {
              name: 'Relay User',
              login: 'relay-login',
              avatar_url: ''
            }
          })
        }

        if (url === 'https://outstatic.com/api/outstatic/auth/exchange-token') {
          return jsonResponse(
            {
              error: 'invalid_exchange'
            },
            { status: 401 }
          )
        }

        throw new Error(`Unexpected fetch URL: ${url}`)
      }
    )

    const {
      callbackRoute,
      getAccessTokenMock,
      fetchGitHubUserMock,
      checkCollaboratorWithRepoMock
    } = await setupCallbackRoute({
      OUTSTATIC_API_KEY: 'pro-key'
    })

    getAccessTokenMock.mockResolvedValue({
      access_token: 'github-access-token',
      expires_in: 3600_000
    })
    fetchGitHubUserMock.mockResolvedValue({
      name: 'GitHub User',
      login: 'gh-user',
      email: 'github@example.com',
      avatar_url: ''
    })
    checkCollaboratorWithRepoMock.mockResolvedValue(false)

    const response = await callbackRoute(
      createNextRequest('https://self-host.dev/api/outstatic/callback?code=abc')
    )

    expect(response.status).toBe(307)
    expect(getLocationHeader(response)).toBe(
      'https://self-host.dev/outstatic?error=session-error'
    )
  })
})
