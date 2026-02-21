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
  UpgradeDialog: ({
    children,
    open = false
  }: {
    children?: ReactNode
    open?: boolean
  }) => (
    <div data-testid="upgrade-dialog" data-open={String(open)}>
      {children}
    </div>
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

  it('renders GitHub link and Google sign-in action', () => {
    render(<Login />)

    expect(
      screen.getByRole('link', {
        name: /sign in with github/i
      })
    ).toBeInTheDocument()

    expect(
      screen.getByRole('button', {
        name: /sign in with google/i
      })
    ).toBeInTheDocument()
  })

  it('shows FREE and PRO badges for non-pro projects', () => {
    render(<Login />)

    expect(screen.getByText('FREE')).toBeInTheDocument()
    expect(screen.getAllByText('PRO')).toHaveLength(2)
  })

  it('hides FREE and PRO badges for pro projects', () => {
    render(<Login isPro />)

    expect(screen.queryByText('FREE')).not.toBeInTheDocument()
    expect(screen.queryByText('PRO')).not.toBeInTheDocument()
  })

  it('opens API key dialog when GitHub backend returns auth-not-configured', async () => {
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

  it('redirects known GitHub login errors to query string', async () => {
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

  it('routes unknown GitHub failures to github-relay-failed', async () => {
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

  it('pushes backend GitHub login URL when request succeeds', async () => {
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

  it('pushes backend Google login URL when request succeeds', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        url: 'https://outstatic.com/api/outstatic/auth/google-exchange?token=abc'
      })
    })

    render(<Login basePath="/cms" isPro />)

    fireEvent.click(
      screen.getByRole('link', {
        name: /sign in with google/i
      })
    )

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith(
        'https://outstatic.com/api/outstatic/auth/google-exchange?token=abc'
      )
    })

    expect(global.fetch).toHaveBeenCalledWith(
      '/cms/api/outstatic/google-login',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })
    )
  })

  it('opens API key dialog when Google backend returns auth-not-configured', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        error: 'auth-not-configured'
      })
    })

    render(<Login isPro />)

    const googleButton = screen.getByRole('link', {
      name: /sign in with google/i
    })

    fireEvent.click(googleButton)

    await waitFor(() => {
      expect(screen.getByTestId('api-key-dialog')).toHaveAttribute(
        'data-open',
        'true'
      )
    })
  })

  it('routes unknown Google failures to google-relay-failed', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('network unavailable')
    )

    render(<Login isPro />)

    fireEvent.click(
      screen.getByRole('link', {
        name: /sign in with google/i
      })
    )

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith(
        '/outstatic?error=google-relay-failed'
      )
    })
  })

  it('shows upgrade flow for Google sign-in when not pro', async () => {
    render(<Login />)

    fireEvent.click(
      screen.getByRole('button', {
        name: /sign in with google/i
      })
    )

    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  it('opens upgrade dialog when non-pro user focuses email input', async () => {
    render(<Login />)

    const upgradeDialog = screen.getByTestId('upgrade-dialog')
    expect(upgradeDialog).toHaveAttribute('data-open', 'false')

    fireEvent.focus(screen.getByPlaceholderText(/enter your email/i))

    await waitFor(() => {
      expect(upgradeDialog).toHaveAttribute('data-open', 'true')
    })
  })
})
