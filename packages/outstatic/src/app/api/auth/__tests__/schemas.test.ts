import {
  ExchangeTokenResponseSchema,
  GoogleLoginRequestSchema
} from '../schemas'

describe('ExchangeTokenResponseSchema', () => {
  it('accepts payloads without user.login', () => {
    const parsed = ExchangeTokenResponseSchema.parse({
      user: {
        email: 'member@example.com',
        name: 'Member User',
        avatar_url: 'https://example.com/avatar.png',
        permissions: ['content.manage']
      },
      session: {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_at: 2_000_000_000
      }
    })

    expect(parsed.user.login).toBeUndefined()
    expect(parsed.user.email).toBe('member@example.com')
  })

  it('accepts null user.login values', () => {
    const parsed = ExchangeTokenResponseSchema.parse({
      user: {
        email: 'member@example.com',
        login: null,
        name: 'Member User',
        avatar_url: 'https://example.com/avatar.png',
        permissions: []
      },
      session: {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_at: 2_000_000_000
      }
    })

    expect(parsed.user.login).toBeNull()
  })

  it('transforms empty avatar_url strings into null', () => {
    const parsed = ExchangeTokenResponseSchema.parse({
      user: {
        email: 'member@example.com',
        name: 'Member User',
        avatar_url: '',
        permissions: []
      },
      session: {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_at: 2_000_000_000
      }
    })

    expect(parsed.user.avatar_url).toBeNull()
  })

  it('accepts optional refresh token expiry session fields', () => {
    const parsed = ExchangeTokenResponseSchema.parse({
      user: {
        email: 'member@example.com',
        name: 'Member User',
        avatar_url: 'https://example.com/avatar.png',
        permissions: []
      },
      session: {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_at: 2_000_000_000,
        refresh_token_expires_in: 2_592_000_000,
        refresh_token_expires_at: 2_100_000_000
      }
    })

    expect(parsed.session.refresh_token_expires_in).toBe(2_592_000_000)
    expect(parsed.session.refresh_token_expires_at).toBe(2_100_000_000)
  })
})

describe('GoogleLoginRequestSchema', () => {
  it('accepts empty request payload', () => {
    const parsed = GoogleLoginRequestSchema.parse({})
    expect(parsed.returnUrl).toBeUndefined()
  })

  it('accepts a valid returnUrl', () => {
    const parsed = GoogleLoginRequestSchema.parse({
      returnUrl: 'https://self-host.dev/outstatic'
    })

    expect(parsed.returnUrl).toBe('https://self-host.dev/outstatic')
  })
})
