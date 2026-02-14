import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'

import Login from '../login'

const pushMock = jest.fn()
let currentSearchError: string | null = null

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock
  }),
  useSearchParams: () => ({
    get: (key: string) => (key === 'error' ? currentSearchError : null)
  })
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    children,
    href,
    ...props
  }: {
    children: ReactNode
    href: string
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}))

jest.mock('@/components/ui/outstatic/loading-background', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => (
    <div data-testid="loading-background">{children}</div>
  )
}))

jest.mock('@/components/ui/outstatic/upgrade-dialog', () => ({
  UpgradeDialog: ({ children }: { children: ReactNode }) => (
    <>{children}</>
  )
}))

jest.mock('@/components/ui/outstatic/api-key-login-dialog', () => ({
  ApiKeyLoginDialog: ({ open }: { open: boolean }) => (
    <div data-testid="api-key-dialog" data-open={String(open)} />
  )
}))

describe('<Login />', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    currentSearchError = null
    global.fetch = jest.fn()
    window.history.pushState({}, '', '/outstatic')
  })

  it('opens API key dialog when backend returns auth-not-configured', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        error: 'auth-not-configured'
      })
    })

    render(<Login basePath="/cms" />)

    const githubButton = screen.getByRole('link', {
      name: /sign in with github/i
    })

    fireEvent.click(githubButton)

    await waitFor(() => {
      expect(screen.getByTestId('api-key-dialog')).toHaveAttribute(
        'data-open',
        'true'
      )
    })

    expect(pushMock).not.toHaveBeenCalled()

    await waitFor(() => {
      expect(githubButton.className).not.toContain('animate-pulse')
    })
  })

  it('redirects known login errors to query string', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({
        error: 'invalid-api-key'
      })
    })

    render(<Login />)

    fireEvent.click(
      screen.getByRole('link', {
        name: /sign in with github/i
      })
    )

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/outstatic?error=invalid-api-key')
    })
  })

  it('routes unknown failures to github-relay-failed', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('network unavailable')
    )

    render(<Login />)

    fireEvent.click(
      screen.getByRole('link', {
        name: /sign in with github/i
      })
    )

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith(
        '/outstatic?error=github-relay-failed'
      )
    })
  })

  it('pushes backend login URL when request succeeds', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        url: 'https://outstatic.com/api/outstatic/auth/github-exchange?token=abc'
      })
    })

    render(<Login basePath="/cms" />)

    fireEvent.click(
      screen.getByRole('link', {
        name: /sign in with github/i
      })
    )

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith(
        'https://outstatic.com/api/outstatic/auth/github-exchange?token=abc'
      )
    })
  })
})
