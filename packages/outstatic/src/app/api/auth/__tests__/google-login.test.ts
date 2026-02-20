import type { NextRequest } from 'next/server'

import {
  createNextRequest,
  ensureWebApiGlobals,
  getLocationHeader,
  jsonResponse,
  ORIGINAL_ENV,
  resetEnv
} from '../test-helpers'

function createPostRequest(
  url: string,
  body: Record<string, unknown> = {}
): NextRequest {
  ensureWebApiGlobals()

  return {
    url,
    method: 'POST',
    headers: new Headers({
      'Content-Type': 'application/json'
    }),
    text: async () => JSON.stringify(body)
  } as unknown as NextRequest
}

function createGetRequest(url: string): NextRequest {
  return createNextRequest(url, { method: 'GET' })
}

async function readJsonBody(response: Response) {
  const text = await response.text().catch(() => '')

  if (!text) {
    return undefined
  }

  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

describe('/api/outstatic/google-login', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    ensureWebApiGlobals()
    global.fetch = jest.fn()
  })

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  it('calls relay endpoint and returns url when request succeeds', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({
        url: 'https://outstatic.com/api/outstatic/auth/google-exchange?token=abc123'
      })
    )

    resetEnv({
      OUTSTATIC_API_KEY: 'pro-key',
      OUTSTATIC_API_URL: 'https://outstatic.com/api',
      OST_BASE_PATH: '/cms/'
    })

    const { default: googleLoginRoute } = await import('../google-login')
    const response = await googleLoginRoute(
      createPostRequest('https://self-host.dev/api/outstatic/google-login')
    )
    const data = await readJsonBody(response)

    expect(response.status).toBe(200)
    expect(data.url).toBe(
      'https://outstatic.com/api/outstatic/auth/google-exchange?token=abc123'
    )
    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(global.fetch).toHaveBeenCalledWith(
      'https://outstatic.com/api/outstatic/auth/google-exchange',
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
      callbackUrl: 'https://self-host.dev/cms/api/outstatic/callback',
      returnUrl: 'https://self-host.dev/cms/outstatic'
    })
  })

  it('uses request returnUrl when provided', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({
        url: 'https://outstatic.com/api/outstatic/auth/google-exchange?token=abc123'
      })
    )

    resetEnv({
      OUTSTATIC_API_KEY: 'pro-key',
      OUTSTATIC_API_URL: 'https://outstatic.com/api'
    })

    const { default: googleLoginRoute } = await import('../google-login')
    await googleLoginRoute(
      createPostRequest('https://self-host.dev/api/outstatic/google-login', {
        returnUrl: 'https://self-host.dev/outstatic/collections'
      })
    )

    const fetchBody = (global.fetch as jest.Mock).mock.calls[0]?.[1]?.body
    expect(JSON.parse(fetchBody)).toEqual({
      callbackUrl: 'https://self-host.dev/api/outstatic/callback',
      returnUrl: 'https://self-host.dev/outstatic/collections'
    })
  })

  it('returns auth-not-configured when OUTSTATIC_API_KEY is missing', async () => {
    resetEnv({
      OUTSTATIC_API_KEY: undefined
    })

    const { default: googleLoginRoute } = await import('../google-login')
    const response = await googleLoginRoute(
      createPostRequest('https://self-host.dev/api/outstatic/google-login')
    )
    const data = await readJsonBody(response)

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
      ;(global.fetch as jest.Mock).mockResolvedValueOnce(
        jsonResponse(
          {
            error: relayErrorCode
          },
          { status: relayStatus }
        )
      )

      resetEnv({
        OUTSTATIC_API_KEY: 'pro-key',
        OUTSTATIC_API_URL: 'https://outstatic.com/api'
      })

      const { default: googleLoginRoute } = await import('../google-login')
      const response = await googleLoginRoute(
        createPostRequest('https://self-host.dev/api/outstatic/google-login')
      )
      const data = await readJsonBody(response)

      expect(response.status).toBe(relayStatus)
      expect(data).toEqual({ error: relayErrorCode })
    }
  )

  it('falls back to google-relay-failed for unknown relay errors', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse(
        {
          error: 'unexpected-error'
        },
        { status: 500 }
      )
    )

    resetEnv({
      OUTSTATIC_API_KEY: 'pro-key',
      OUTSTATIC_API_URL: 'https://outstatic.com/api'
    })

    const { default: googleLoginRoute } = await import('../google-login')
    const response = await googleLoginRoute(
      createPostRequest('https://self-host.dev/api/outstatic/google-login')
    )
    const data = await readJsonBody(response)

    expect(response.status).toBe(500)
    expect(data).toEqual({ error: 'google-relay-failed' })
  })

  it('falls back to google-relay-failed for malformed relay success payload', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse({}))

    resetEnv({
      OUTSTATIC_API_KEY: 'pro-key',
      OUTSTATIC_API_URL: 'https://outstatic.com/api'
    })

    const { default: googleLoginRoute } = await import('../google-login')
    const response = await googleLoginRoute(
      createPostRequest('https://self-host.dev/api/outstatic/google-login')
    )
    const data = await readJsonBody(response)

    expect(response.status).toBe(500)
    expect(data).toEqual({ error: 'google-relay-failed' })
  })

  it('falls back to google-relay-failed when relay request throws', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('network failure')
    )

    resetEnv({
      OUTSTATIC_API_KEY: 'pro-key',
      OUTSTATIC_API_URL: 'https://outstatic.com/api'
    })

    const { default: googleLoginRoute } = await import('../google-login')
    const response = await googleLoginRoute(
      createPostRequest('https://self-host.dev/api/outstatic/google-login')
    )
    const data = await readJsonBody(response)

    expect(response.status).toBe(500)
    expect(data).toEqual({ error: 'google-relay-failed' })
  })

  it('redirects GET requests directly to Google exchange URL', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({
        url: 'https://outstatic.com/api/outstatic/auth/google-exchange?token=abc123'
      })
    )

    resetEnv({
      OUTSTATIC_API_KEY: 'pro-key',
      OUTSTATIC_API_URL: 'https://outstatic.com/api',
      OST_BASE_PATH: '/cms'
    })

    const { GET: googleLoginGetRoute } = await import('../google-login')
    const response = await googleLoginGetRoute(
      createGetRequest('https://self-host.dev/cms/api/outstatic/google-login')
    )

    expect(response.status).toBe(302)
    expect(getLocationHeader(response)).toBe(
      'https://outstatic.com/api/outstatic/auth/google-exchange?token=abc123'
    )
  })

  it('redirects GET failures to returnUrl with an error code', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse(
        {
          error: 'invalid-api-key'
        },
        { status: 401 }
      )
    )

    resetEnv({
      OUTSTATIC_API_KEY: 'pro-key',
      OUTSTATIC_API_URL: 'https://outstatic.com/api'
    })

    const { GET: googleLoginGetRoute } = await import('../google-login')
    const response = await googleLoginGetRoute(
      createGetRequest(
        'https://self-host.dev/api/outstatic/google-login?returnUrl=https%3A%2F%2Fself-host.dev%2Foutstatic%3Ffoo%3Dbar'
      )
    )

    expect(response.status).toBe(302)
    expect(getLocationHeader(response)).toBe(
      'https://self-host.dev/outstatic?foo=bar&error=invalid-api-key'
    )
  })
})
