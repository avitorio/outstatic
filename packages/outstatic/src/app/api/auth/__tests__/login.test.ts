import {
  createNextRequest,
  ensureWebApiGlobals,
  jsonResponse,
  ORIGINAL_ENV,
  resetEnv
} from '../test-helpers'

describe('/api/outstatic/login', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    ensureWebApiGlobals()
    global.fetch = jest.fn()
  })

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  it('returns local GitHub OAuth URL when local credentials are configured', async () => {
    resetEnv({
      OST_GITHUB_ID: 'local-client-id',
      OST_GITHUB_SECRET: 'local-client-secret',
      OST_GITHUB_CALLBACK_URL: 'https://self-host.dev/api/outstatic/callback',
      OUTSTATIC_API_KEY: undefined
    })

    const { default: loginRoute } = await import('../login')
    const response = await loginRoute(
      createNextRequest('https://self-host.dev/api/outstatic/login')
    )
    const data = await response.json()
    const authUrl = new URL(data.url)

    expect(response.status).toBe(200)
    expect(authUrl.origin).toBe('https://github.com')
    expect(authUrl.pathname).toBe('/login/oauth/authorize')
    expect(authUrl.searchParams.get('client_id')).toBe('local-client-id')
    expect(authUrl.searchParams.get('scope')).toBe('read:user,user:email,repo')
    expect(authUrl.searchParams.get('response_type')).toBe('code')
    expect(authUrl.searchParams.get('redirect_uri')).toBe(
      'https://self-host.dev/api/outstatic/callback'
    )
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('omits redirect_uri when local callback env var is missing', async () => {
    resetEnv({
      OST_GITHUB_ID: 'local-client-id',
      OST_GITHUB_SECRET: 'local-client-secret',
      OST_GITHUB_CALLBACK_URL: undefined,
      OUTSTATIC_API_KEY: undefined
    })

    const { default: loginRoute } = await import('../login')
    const response = await loginRoute(
      createNextRequest('https://self-host.dev/api/outstatic/login')
    )
    const data = await response.json()
    const authUrl = new URL(data.url)

    expect(response.status).toBe(200)
    expect(authUrl.searchParams.get('redirect_uri')).toBeNull()
  })

  it('calls relay endpoint when only OUTSTATIC_API_KEY is configured', async () => {
    ; (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({
        url: 'https://outstatic.com/api/outstatic/auth/github-exchange?token=abc123'
      })
    )

    resetEnv({
      OST_GITHUB_ID: undefined,
      OST_GITHUB_SECRET: undefined,
      OUTSTATIC_API_KEY: 'pro-key',
      OUTSTATIC_API_URL: 'https://outstatic.com/api',
      OST_BASE_PATH: '/cms/'
    })

    const { default: loginRoute } = await import('../login')
    const response = await loginRoute(
      createNextRequest('https://self-host.dev/api/outstatic/login')
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.url).toBe(
      'https://outstatic.com/api/outstatic/auth/github-exchange?token=abc123'
    )
    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(global.fetch).toHaveBeenCalledWith(
      'https://outstatic.com/api/outstatic/auth/github-exchange',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer pro-key'
        })
      })
    )

    const fetchBody = (global.fetch as jest.Mock).mock.calls[0]?.[1]?.body
    expect(JSON.parse(fetchBody)).toEqual({
      callback_url: 'https://self-host.dev/cms/api/outstatic/callback'
    })
  })

  it('returns auth-not-configured when no auth mode is configured', async () => {
    resetEnv({
      OST_GITHUB_ID: undefined,
      OST_GITHUB_SECRET: undefined,
      OUTSTATIC_API_KEY: undefined
    })

    const { default: loginRoute } = await import('../login')
    const response = await loginRoute(
      createNextRequest('https://self-host.dev/api/outstatic/login')
    )
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toEqual({ error: 'auth-not-configured' })
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it.each([
    ['invalid-api-key', 401],
    ['project-url-not-configured', 400],
    ['invalid-callback-domain', 400],
    ['invalid-callback-target', 400]
  ])(
    'passes through relay error code "%s"',
    async (relayErrorCode, relayStatus) => {
      ; (global.fetch as jest.Mock).mockResolvedValueOnce(
        jsonResponse(
          {
            error: relayErrorCode
          },
          { status: relayStatus }
        )
      )

      resetEnv({
        OST_GITHUB_ID: undefined,
        OST_GITHUB_SECRET: undefined,
        OUTSTATIC_API_KEY: 'pro-key',
        OUTSTATIC_API_URL: 'https://outstatic.com/api'
      })

      const { default: loginRoute } = await import('../login')
      const response = await loginRoute(
        createNextRequest('https://self-host.dev/api/outstatic/login')
      )
      const data = await response.json()

      expect(response.status).toBe(relayStatus)
      expect(data).toEqual({ error: relayErrorCode })
    }
  )

  it('falls back to github-relay-failed for unknown relay errors', async () => {
    ; (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse(
        {
          error: 'unexpected-error'
        },
        { status: 500 }
      )
    )

    resetEnv({
      OST_GITHUB_ID: undefined,
      OST_GITHUB_SECRET: undefined,
      OUTSTATIC_API_KEY: 'pro-key',
      OUTSTATIC_API_URL: 'https://outstatic.com/api'
    })

    const { default: loginRoute } = await import('../login')
    const response = await loginRoute(
      createNextRequest('https://self-host.dev/api/outstatic/login')
    )
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({ error: 'github-relay-failed' })
  })

  it('falls back to github-relay-failed for malformed relay success payload', async () => {
    ; (global.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse({}))

    resetEnv({
      OST_GITHUB_ID: undefined,
      OST_GITHUB_SECRET: undefined,
      OUTSTATIC_API_KEY: 'pro-key',
      OUTSTATIC_API_URL: 'https://outstatic.com/api'
    })

    const { default: loginRoute } = await import('../login')
    const response = await loginRoute(
      createNextRequest('https://self-host.dev/api/outstatic/login')
    )
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({ error: 'github-relay-failed' })
  })

  it('falls back to github-relay-failed when relay request throws', async () => {
    ; (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('network failure')
    )

    resetEnv({
      OST_GITHUB_ID: undefined,
      OST_GITHUB_SECRET: undefined,
      OUTSTATIC_API_KEY: 'pro-key',
      OUTSTATIC_API_URL: 'https://outstatic.com/api'
    })

    const { default: loginRoute } = await import('../login')
    const response = await loginRoute(
      createNextRequest('https://self-host.dev/api/outstatic/login')
    )
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({ error: 'github-relay-failed' })
  })
})
