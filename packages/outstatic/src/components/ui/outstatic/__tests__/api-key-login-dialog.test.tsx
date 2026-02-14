import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'

import { OUTSTATIC_APP_URL } from '@/utils/constants'
import { ApiKeyLoginDialog } from '../api-key-login-dialog'

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

describe('<ApiKeyLoginDialog />', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.history.pushState({}, '', '/')
  })

  it('renders setup steps with CTA to Outstatic sign-up and callback origin', async () => {
    render(<ApiKeyLoginDialog open onOpenChange={jest.fn()} basePath="/cms" />)

    expect(
      screen.getByText('Connect GitHub in 3 quick steps')
    ).toBeInTheDocument()
    expect(
      screen.getByText('Create your Outstatic account')
    ).toBeInTheDocument()
    expect(screen.getByText('Generate a project API key')).toBeInTheDocument()
    expect(screen.getByText('Add it to your app')).toBeInTheDocument()
    expect(
      screen.getByText('OUTSTATIC_API_KEY=your_api_key_here')
    ).toBeInTheDocument()

    const cta = screen.getByRole('link', {
      name: /create a free api key on outstatic\.com/i
    })
    const href = cta.getAttribute('href')

    expect(href).toBeTruthy()

    const ctaUrl = new URL(href as string)
    expect(ctaUrl.origin).toBe(new URL(OUTSTATIC_APP_URL).origin)
    expect(ctaUrl.pathname).toBe('/auth/sign-up')
    expect(ctaUrl.searchParams.get('provider')).toBe('github')
    expect(ctaUrl.searchParams.get('feature')).toBe('api-keys')
    expect(ctaUrl.searchParams.get('auto_generate_api_key')).toBe('1')
    expect(ctaUrl.searchParams.get('callback_origin')).toBe(
      'http://localhost/cms/outstatic'
    )
  })

  it('builds callback_origin without basePath when basePath is missing', async () => {
    render(<ApiKeyLoginDialog open onOpenChange={jest.fn()} />)

    const cta = screen.getByRole('link', {
      name: /create a free api key on outstatic\.com/i
    })

    const ctaUrl = new URL(cta.getAttribute('href') as string)
    expect(ctaUrl.searchParams.get('callback_origin')).toBe(
      'http://localhost/outstatic'
    )
  })
})
