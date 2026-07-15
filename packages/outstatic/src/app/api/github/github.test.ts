import { getLoginSession, refreshTokenIfNeeded } from '@/utils/auth/auth'
import { ensureWebApiGlobals, jsonResponse } from '@/app/api/auth/test-helpers'

jest.mock('@/utils/auth/auth', () => ({
  getLoginSession: jest.fn(),
  refreshTokenIfNeeded: jest.fn()
}))

const mockGetLoginSession = getLoginSession as jest.MockedFunction<
  typeof getLoginSession
>
const mockRefreshTokenIfNeeded = refreshTokenIfNeeded as jest.MockedFunction<
  typeof refreshTokenIfNeeded
>

type GitHubApi = typeof import('./github')
type GitHubPostRequest = Parameters<GitHubApi['POST']>[0]
type GitHubGetRequest = Parameters<GitHubApi['GET']>[0]

let githubApi: GitHubApi

function createJsonRequest(body: unknown) {
  return {
    method: 'POST',
    url: 'http://localhost:3000/api/outstatic/github',
    json: jest.fn().mockResolvedValue(body)
  } as unknown as GitHubPostRequest
}

function createGetRequest(url: string, remainingPath: string[]) {
  return {
    method: 'GET',
    url,
    remainingPath
  } as unknown as GitHubGetRequest
}

describe('GitHub REST API endpoint', () => {
  const mockSession = {
    user: {
      name: 'Test User',
      login: 'testuser',
      email: 'test@example.com',
      image: 'https://example.com/avatar.jpg'
    },
    provider: 'github' as const,
    access_token: 'test-access-token',
    expires: new Date(Date.now() + 3600000),
    refresh_token: 'test-refresh-token',
    refresh_token_expires: new Date(Date.now() + 86400000)
  }

  beforeAll(async () => {
    ensureWebApiGlobals()
    githubApi = await import('./github')
  })

  beforeEach(() => {
    jest.clearAllMocks()
    ensureWebApiGlobals()
    global.fetch = jest.fn().mockResolvedValue(
      jsonResponse({
        id: 123,
        login: 'testuser'
      })
    )
    mockGetLoginSession.mockResolvedValue(mockSession)
    mockRefreshTokenIfNeeded.mockResolvedValue(mockSession)
  })

  it('proxies path-only body endpoints to api.github.com with the session token', async () => {
    const response = await githubApi.POST(
      createJsonRequest({
        endpoint: '/user',
        method: 'GET'
      })
    )

    expect(response.status).toBe(200)
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.github.com/user',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'token test-access-token',
          'User-Agent': 'Outstatic-GitHub-API',
          Accept: 'application/vnd.github.v3+json'
        })
      })
    )
  })

  it('rejects host-confusion endpoints before sending the session token', async () => {
    const response = await githubApi.POST(
      createJsonRequest({
        endpoint: '.attacker.example/steal',
        method: 'GET'
      })
    )

    expect(response.status).toBe(400)
    expect(mockGetLoginSession).not.toHaveBeenCalled()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('rejects protocol-relative endpoints that resolve away from api.github.com', async () => {
    const response = await githubApi.POST(
      createJsonRequest({
        endpoint: '//attacker.example/steal',
        method: 'GET'
      })
    )

    expect(response.status).toBe(400)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('uses path-based routing for GET and strips header query parameters from the upstream URL', async () => {
    await githubApi.GET(
      createGetRequest(
        'http://localhost:3000/api/outstatic/github/search/repositories?q=outstatic&per_page=10&header-X-GitHub-Api-Version=2022-11-28',
        ['search', 'repositories']
      )
    )

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.github.com/search/repositories?q=outstatic&per_page=10',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'token test-access-token',
          'X-GitHub-Api-Version': '2022-11-28'
        })
      })
    )
  })

  it('does not allow request headers to override protected upstream headers', async () => {
    await githubApi.POST(
      createJsonRequest({
        endpoint: '/user',
        method: 'GET',
        headers: {
          Authorization: 'token attacker-token',
          Host: 'attacker.example',
          'User-Agent': 'attacker-agent',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      })
    )

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.github.com/user',
      expect.objectContaining({
        headers: {
          Authorization: 'token test-access-token',
          'User-Agent': 'Outstatic-GitHub-API',
          Accept: 'application/vnd.github.v3+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      })
    )
  })

  it('canonicalizes forwarded header casing before merging with defaults', async () => {
    await githubApi.POST(
      createJsonRequest({
        endpoint: '/user',
        method: 'POST',
        body: { name: 'test' },
        headers: {
          accept: 'application/vnd.github.v3.raw+json',
          'content-type': 'application/json',
          'x-github-api-version': '2022-11-28'
        }
      })
    )

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.github.com/user',
      expect.objectContaining({
        headers: {
          Authorization: 'token test-access-token',
          'User-Agent': 'Outstatic-GitHub-API',
          Accept: 'application/vnd.github.v3.raw+json',
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      })
    )
  })

  it('uses the refreshed access token for the upstream request', async () => {
    const expiredSession = {
      ...mockSession,
      expires: new Date(Date.now() - 1000)
    }
    const refreshedSession = {
      ...mockSession,
      access_token: 'new-access-token',
      expires: new Date(Date.now() + 3600000)
    }

    mockGetLoginSession.mockResolvedValue(expiredSession)
    mockRefreshTokenIfNeeded.mockResolvedValue(refreshedSession)

    await githubApi.POST(
      createJsonRequest({
        endpoint: '/user',
        method: 'GET'
      })
    )

    expect(mockRefreshTokenIfNeeded).toHaveBeenCalledWith(expiredSession)
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.github.com/user',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'token new-access-token'
        })
      })
    )
  })

  it('returns 401 without calling GitHub when token refresh fails', async () => {
    mockRefreshTokenIfNeeded.mockRejectedValue(
      new Error('Token refresh failed')
    )

    const response = await githubApi.POST(
      createJsonRequest({
        endpoint: '/user',
        method: 'GET'
      })
    )

    expect(response.status).toBe(401)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('returns 400 for invalid POST bodies', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    try {
      const response = await githubApi.POST(
        createJsonRequest({
          endpoint: '/user',
          method: 'TRACE'
        })
      )

      expect(response.status).toBe(400)
      expect(global.fetch).not.toHaveBeenCalled()
    } finally {
      consoleErrorSpy.mockRestore()
    }
  })

  it('returns 400 when no body endpoint or path endpoint is provided', async () => {
    const response = await githubApi.POST(
      createJsonRequest({
        method: 'GET'
      })
    )

    expect(response.status).toBe(400)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('returns 401 when the user is not authenticated', async () => {
    mockGetLoginSession.mockResolvedValue(null)

    const response = await githubApi.POST(
      createJsonRequest({
        endpoint: '/user',
        method: 'GET'
      })
    )

    expect(response.status).toBe(401)
    expect(global.fetch).not.toHaveBeenCalled()
  })
})
