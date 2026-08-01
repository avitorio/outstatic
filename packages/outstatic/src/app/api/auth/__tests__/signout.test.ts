import { createNextRequest, ensureWebApiGlobals } from '../test-helpers'

async function setupSignoutRoute() {
  jest.resetModules()
  ensureWebApiGlobals()

  jest.doMock('@/utils/auth/auth', () => ({
    clearLoginSession: jest.fn()
  }))

  const { default: signoutRoute } = await import('../signout')
  const authModule = await import('@/utils/auth/auth')

  return {
    signoutRoute,
    clearLoginSessionMock: authModule.clearLoginSession as unknown as jest.Mock
  }
}

describe('/api/outstatic/signout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('clears the session for a same-origin POST request', async () => {
    const { signoutRoute, clearLoginSessionMock } = await setupSignoutRoute()

    const response = await signoutRoute(
      createNextRequest('https://self-host.dev/cms/api/outstatic/signout', {
        method: 'POST',
        headers: { origin: 'https://self-host.dev' }
      })
    )

    expect(response.status).toBe(204)
    expect(clearLoginSessionMock).toHaveBeenCalledTimes(1)
  })

  it('rejects a cross-origin POST request without clearing the session', async () => {
    const { signoutRoute, clearLoginSessionMock } = await setupSignoutRoute()

    const response = await signoutRoute(
      createNextRequest('https://self-host.dev/api/outstatic/signout', {
        method: 'POST',
        headers: { origin: 'https://attacker.example' }
      })
    )

    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({ error: 'invalid-origin' })
    expect(clearLoginSessionMock).not.toHaveBeenCalled()
  })

  it('rejects a POST request without an Origin header', async () => {
    const { signoutRoute, clearLoginSessionMock } = await setupSignoutRoute()

    const response = await signoutRoute(
      createNextRequest('https://self-host.dev/api/outstatic/signout', {
        method: 'POST'
      })
    )

    expect(response.status).toBe(403)
    expect(clearLoginSessionMock).not.toHaveBeenCalled()
  })
})
