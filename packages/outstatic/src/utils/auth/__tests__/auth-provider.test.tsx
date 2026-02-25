import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { OUTSTATIC_API_PATH } from '@/utils/constants'
import { AuthProvider, useAuth } from '@/utils/auth/auth-provider'
import { queryClient } from '@/utils/react-query/query-client'
import { toast } from 'sonner'
import type { LoginSession } from '../auth'

const mockPush = jest.fn()
const mockRouter = {
  push: mockPush
}

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter
}))

jest.mock('@/utils/auth/auth-provider', () =>
  jest.requireActual('@/utils/auth/auth-provider')
)

jest.mock('@/utils/react-query/query-client', () => ({
  queryClient: {
    invalidateQueries: jest.fn()
  }
}))

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn()
  }
}))

const mockInvalidateQueries = queryClient.invalidateQueries as jest.Mock
const mockToastError = toast.error as jest.Mock

class MockBroadcastChannel {
  static instances: MockBroadcastChannel[] = []
  name: string
  onmessage: ((event: MessageEvent<any>) => Promise<void>) | null = null
  postMessage = jest.fn()
  close = jest.fn()

  constructor(name: string) {
    this.name = name
    MockBroadcastChannel.instances.push(this)
  }
}

const basePath = '/cms'

function buildSession(login: string): LoginSession {
  return {
    user: {
      name: `${login} name`,
      login,
      email: `${login}@example.com`,
      image: 'https://example.com/avatar.png'
    },
    access_token: `token-${login}`,
    expires: new Date('2030-01-01T00:00:00.000Z'),
    refresh_token: `refresh-${login}`,
    refresh_token_expires: new Date('2030-01-02T00:00:00.000Z')
  }
}

const initialSession = buildSession('initial-user')
const updatedSession = buildSession('updated-user')
const fetchedSession = buildSession('fetched-user')
const refreshedSession = buildSession('refreshed-user')
const crossTabSession = buildSession('cross-tab-user')

function TestConsumer() {
  const { session, status, basePath, updateSession, signOut } = useAuth()

  return (
    <div>
      <div data-testid="status">{status}</div>
      <div data-testid="session-login">{session?.user.login ?? 'none'}</div>
      <div data-testid="base-path">{basePath}</div>
      <button type="button" onClick={() => updateSession(updatedSession)}>
        update-session
      </button>
      <button type="button" onClick={() => updateSession(null)}>
        clear-session
      </button>
      <button type="button" onClick={signOut}>
        sign-out
      </button>
    </div>
  )
}

function renderAuthProvider(session: LoginSession | null = null) {
  return render(
    <AuthProvider initialSession={session} basePath={basePath}>
      <TestConsumer />
    </AuthProvider>
  )
}

function getChannel() {
  const channel =
    MockBroadcastChannel.instances[MockBroadcastChannel.instances.length - 1]
  if (!channel) {
    throw new Error('Expected BroadcastChannel instance to be created')
  }
  return channel
}

async function sendBroadcastMessage(message: unknown) {
  const channel = getChannel()
  if (!channel.onmessage) {
    throw new Error('Expected BroadcastChannel onmessage handler to be set')
  }

  await act(async () => {
    await channel.onmessage?.({ data: message } as MessageEvent<any>)
  })
}

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useRealTimers()
    MockBroadcastChannel.instances = []

    Object.defineProperty(window, 'BroadcastChannel', {
      configurable: true,
      writable: true,
      value: MockBroadcastChannel
    })
    ;(global as any).BroadcastChannel = MockBroadcastChannel

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ session: null })
    }) as jest.Mock

    window.history.pushState({}, '', '/dashboard')
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('throws if useAuth is used outside AuthProvider', () => {
    function OutsideProviderConsumer() {
      useAuth()
      return null
    }

    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    expect(() => render(<OutsideProviderConsumer />)).toThrow(
      'useAuth must be used within an AuthProvider'
    )

    consoleErrorSpy.mockRestore()
  })

  it('uses initialSession and does not fetch on mount', async () => {
    renderAuthProvider(initialSession)

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
    )

    expect(screen.getByTestId('session-login')).toHaveTextContent(
      initialSession.user.login
    )
    expect(screen.getByTestId('base-path')).toHaveTextContent(basePath)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('fetches session when initialSession is not provided', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ session: fetchedSession })
    })

    renderAuthProvider(null)

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
    )

    expect(global.fetch).toHaveBeenCalledWith(
      `${basePath}${OUTSTATIC_API_PATH}/user`
    )
    expect(screen.getByTestId('session-login')).toHaveTextContent(
      fetchedSession.user.login
    )
  })

  it('sets status to unauthenticated when initial fetch fails', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    ;(global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('session request failed')
    )

    renderAuthProvider(null)

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated')
    )

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to fetch initial session:',
      expect.any(Error)
    )

    consoleErrorSpy.mockRestore()
  })

  it('updateSession broadcasts SESSION_UPDATE when session exists', async () => {
    renderAuthProvider(initialSession)

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
    )
    await waitFor(() => expect(MockBroadcastChannel.instances).toHaveLength(1))

    fireEvent.click(screen.getByRole('button', { name: 'update-session' }))

    expect(screen.getByTestId('session-login')).toHaveTextContent(
      updatedSession.user.login
    )
    expect(getChannel().postMessage).toHaveBeenCalledWith({
      type: 'SESSION_UPDATE',
      session: updatedSession
    })
  })

  it('updateSession does not broadcast when session is null', async () => {
    renderAuthProvider(initialSession)

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
    )
    await waitFor(() => expect(MockBroadcastChannel.instances).toHaveLength(1))

    fireEvent.click(screen.getByRole('button', { name: 'clear-session' }))

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated')
    )
    expect(screen.getByTestId('session-login')).toHaveTextContent('none')
    expect(getChannel().postMessage).not.toHaveBeenCalled()
  })

  it('signOut clears session, invalidates queries, broadcasts, and redirects', async () => {
    renderAuthProvider(initialSession)

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
    )
    await waitFor(() => expect(MockBroadcastChannel.instances).toHaveLength(1))

    fireEvent.click(screen.getByRole('button', { name: 'sign-out' }))

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated')
    )

    expect(mockInvalidateQueries).toHaveBeenCalled()
    expect(getChannel().postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'SIGN_OUT',
        timestamp: expect.any(Number)
      })
    )
    expect(mockPush).toHaveBeenCalledWith(
      `${basePath}${OUTSTATIC_API_PATH}/signout`
    )
  })

  it('handles SESSION_UPDATE message from another tab', async () => {
    renderAuthProvider(initialSession)

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
    )

    await sendBroadcastMessage({
      type: 'SESSION_UPDATE',
      session: crossTabSession
    })

    expect(screen.getByTestId('session-login')).toHaveTextContent(
      crossTabSession.user.login
    )
    expect(mockInvalidateQueries).toHaveBeenCalled()
  })

  it('handles REFRESH_SUCCESS by fetching the newest session', async () => {
    renderAuthProvider(initialSession)

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
    )
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ session: refreshedSession })
    })

    await sendBroadcastMessage({
      type: 'REFRESH_SUCCESS',
      timestamp: Date.now()
    })

    await waitFor(() =>
      expect(screen.getByTestId('session-login')).toHaveTextContent(
        refreshedSession.user.login
      )
    )
    expect(global.fetch).toHaveBeenCalledWith(
      `${basePath}${OUTSTATIC_API_PATH}/user`
    )
    expect(mockInvalidateQueries).toHaveBeenCalled()
  })

  it('handles REFRESH_FAILED by showing toast and redirecting when outside /outstatic', async () => {
    jest.useFakeTimers()
    window.history.pushState({}, '', '/dashboard/content')

    renderAuthProvider(initialSession)

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
    )

    await sendBroadcastMessage({
      type: 'REFRESH_FAILED',
      timestamp: Date.now()
    })

    expect(mockToastError).toHaveBeenCalledWith(
      'Session expired. Please log in again.'
    )

    act(() => {
      jest.advanceTimersByTime(100)
    })

    expect(mockPush).toHaveBeenCalledWith(`${basePath}/outstatic`)
  })

  it('handles SIGN_OUT message by clearing session and redirecting when outside /outstatic', async () => {
    jest.useFakeTimers()
    window.history.pushState({}, '', '/dashboard/content')

    renderAuthProvider(initialSession)

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
    )

    await sendBroadcastMessage({
      type: 'SIGN_OUT',
      timestamp: Date.now()
    })

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated')
    )
    expect(mockInvalidateQueries).toHaveBeenCalled()

    act(() => {
      jest.runOnlyPendingTimers()
    })

    expect(mockPush).toHaveBeenCalledWith(`${basePath}/outstatic`)
  })

  it('closes BroadcastChannel on unmount', () => {
    const { unmount } = renderAuthProvider(initialSession)
    const channel = getChannel()

    unmount()

    expect(channel.close).toHaveBeenCalledTimes(1)
  })
})
