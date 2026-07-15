import { ensureWebApiGlobals } from '../../auth/test-helpers'

const mockGetLoginSession = jest.fn()
const mockConfig: {
  OUTSTATIC_API_KEY?: string
  OUTSTATIC_API_URL: string
} = {
  OUTSTATIC_API_KEY: 'project-api-key',
  OUTSTATIC_API_URL: 'https://api.outstatic.test'
}

jest.mock('@/utils/auth/auth', () => ({
  getLoginSession: mockGetLoginSession
}))
jest.mock('@/utils/constants', () => mockConfig)

describe('/api/outstatic/scan', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ensureWebApiGlobals()
    global.fetch = jest.fn()
    mockConfig.OUTSTATIC_API_KEY = 'project-api-key'
  })

  const loadRoute = async () => (await import('../index')).default

  it('rejects unauthenticated requests before proxying with the project API key', async () => {
    mockGetLoginSession.mockResolvedValue(null)
    const POST = await loadRoute()

    const response = await POST({} as Request)

    expect(response.status).toBe(401)
    expect(await response.text()).toBe('Unauthorized')
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('returns 404 when repository discovery is not configured', async () => {
    mockGetLoginSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockConfig.OUTSTATIC_API_KEY = undefined
    const POST = await loadRoute()

    const response = await POST({} as Request)

    expect(response.status).toBe(404)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('forwards authenticated scan requests without exposing upstream headers', async () => {
    mockGetLoginSession.mockResolvedValue({ user: { id: 'user-1' } })
    ;(global.fetch as jest.Mock).mockResolvedValue(
      new Response(JSON.stringify({ suggestions: [] }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': 'upstream-session=secret',
          'X-Upstream': 'internal'
        }
      })
    )
    const POST = await loadRoute()
    const request = new Request('https://self-host.test/api/outstatic/scan', {
      method: 'POST',
      body: JSON.stringify({ projectId: 'project-1' })
    })

    const response = await POST(request)

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.outstatic.test/outstatic/scan',
      expect.objectContaining({
        method: 'POST',
        body: request.body,
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer project-api-key'
        })
      })
    )
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('application/json')
    expect(response.headers.get('set-cookie')).toBeNull()
    expect(response.headers.get('x-upstream')).toBeNull()
  })

  it('returns 502 when the upstream scan service is unavailable', async () => {
    mockGetLoginSession.mockResolvedValue({ user: { id: 'user-1' } })
    ;(global.fetch as jest.Mock).mockRejectedValue(
      new TypeError('fetch failed')
    )
    const POST = await loadRoute()
    const request = new Request('https://self-host.test/api/outstatic/scan', {
      method: 'POST',
      body: JSON.stringify({ projectId: 'project-1' })
    })

    const response = await POST(request)

    expect(response.status).toBe(502)
    expect(await response.json()).toEqual({
      message: 'Repository scan service is unavailable.'
    })
  })

  it.each(['AbortError', 'TimeoutError'])(
    'returns 504 when the upstream scan fails with %s',
    async (errorName) => {
      mockGetLoginSession.mockResolvedValue({ user: { id: 'user-1' } })
      const timeoutError = new Error('timed out')
      timeoutError.name = errorName
      ;(global.fetch as jest.Mock).mockRejectedValue(timeoutError)
      const POST = await loadRoute()
      const request = new Request('https://self-host.test/api/outstatic/scan', {
        method: 'POST',
        body: JSON.stringify({ projectId: 'project-1' })
      })

      const response = await POST(request)

      expect(response.status).toBe(504)
      expect(await response.json()).toEqual({
        message: 'Repository scan timed out.'
      })
    }
  )
})
