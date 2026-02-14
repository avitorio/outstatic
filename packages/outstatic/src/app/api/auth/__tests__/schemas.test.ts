import { ExchangeTokenResponseSchema } from '../schemas'

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
})
