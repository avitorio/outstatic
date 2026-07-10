import { getLoginSession } from '@/utils/auth/auth'
import { ensureWebApiGlobals } from '../../auth/test-helpers'
import POST from '../index'

jest.mock('@/utils/auth/auth', () => ({
  getLoginSession: jest.fn()
}))

describe('/api/outstatic/scan', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ensureWebApiGlobals()
    global.fetch = jest.fn()
  })

  it('rejects unauthenticated requests before proxying with the project API key', async () => {
    ;(getLoginSession as jest.Mock).mockResolvedValue(null)

    const response = await POST({} as Request)

    expect(response.status).toBe(401)
    expect(await response.text()).toBe('Unauthorized')
    expect(global.fetch).not.toHaveBeenCalled()
  })
})
