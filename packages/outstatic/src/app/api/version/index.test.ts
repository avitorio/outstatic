import { getLoginSession } from '@/utils/auth/auth'
import { OUTSTATIC_APP_URL, OUTSTATIC_VERSION } from '@/utils/constants'
import {
  Headers as CrossFetchHeaders,
  Response as CrossFetchResponse
} from 'cross-fetch'
import GET from '.'

jest.mock('@/utils/auth/auth', () => ({
  getLoginSession: jest.fn()
}))

const mockedGetLoginSession = jest.mocked(getLoginSession)

describe('version proxy', () => {
  const originalHeaders = globalThis.Headers
  const originalResponse = globalThis.Response

  beforeAll(() => {
    Object.defineProperty(globalThis, 'Headers', {
      configurable: true,
      value: CrossFetchHeaders
    })
    Object.defineProperty(globalThis, 'Response', {
      configurable: true,
      value: CrossFetchResponse
    })
  })

  afterAll(() => {
    Object.defineProperty(globalThis, 'Headers', {
      configurable: true,
      value: originalHeaders
    })
    Object.defineProperty(globalThis, 'Response', {
      configurable: true,
      value: originalResponse
    })
  })

  beforeEach(() => {
    mockedGetLoginSession.mockResolvedValue({} as never)
    global.fetch = jest.fn()
  })

  it('sends only the bundled version to the hosted endpoint', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue(
      new CrossFetchResponse(
        JSON.stringify({
          currentVersion: OUTSTATIC_VERSION,
          latestVersion: OUTSTATIC_VERSION,
          updateAvailable: false
        }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    )

    const response = await GET()
    const baseUrl = OUTSTATIC_APP_URL.replace(/\/$/, '')
    const params = new URLSearchParams({ version: OUTSTATIC_VERSION })

    expect(global.fetch).toHaveBeenCalledWith(
      `${baseUrl}/api/outstatic/version?${params.toString()}`,
      {
        cache: 'no-store',
        headers: { Accept: 'application/json' }
      }
    )
    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('private, max-age=86400')
  })

  it('does not contact the hosted endpoint without a session', async () => {
    mockedGetLoginSession.mockResolvedValue(null)

    const response = await GET()

    expect(response.status).toBe(401)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('returns a service error when the hosted endpoint is unavailable', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('offline'))

    const response = await GET()

    expect(response.status).toBe(503)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
  })

  it('does not cache errors returned by the hosted endpoint', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue(
      new CrossFetchResponse('Unavailable', { status: 503 })
    )

    const response = await GET()

    expect(response.status).toBe(503)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
  })
})
