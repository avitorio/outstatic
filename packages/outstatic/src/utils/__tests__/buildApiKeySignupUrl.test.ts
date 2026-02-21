import { OUTSTATIC_APP_URL } from '@/utils/constants'

import {
  buildApiKeySignupUrl,
  buildOutstaticCallbackOrigin
} from '../buildApiKeySignupUrl'

describe('buildOutstaticCallbackOrigin', () => {
  it('builds callback origin including basePath', () => {
    expect(buildOutstaticCallbackOrigin('https://example.com', '/cms')).toBe(
      'https://example.com/cms/outstatic'
    )
  })

  it('removes trailing slashes from basePath', () => {
    expect(buildOutstaticCallbackOrigin('https://example.com', '/cms///')).toBe(
      'https://example.com/cms/outstatic'
    )
  })

  it('builds callback origin when basePath is missing', () => {
    expect(buildOutstaticCallbackOrigin('https://example.com')).toBe(
      'https://example.com/outstatic'
    )
  })
})

describe('buildApiKeySignupUrl', () => {
  it('creates base API key sign-up URL', () => {
    const url = new URL(buildApiKeySignupUrl())

    expect(url.origin).toBe(new URL(OUTSTATIC_APP_URL).origin)
    expect(url.pathname).toBe('/auth/sign-up')
    expect(url.searchParams.get('provider')).toBe('github')
    expect(url.searchParams.get('feature')).toBe('api-keys')
    expect(url.searchParams.get('auto_generate_api_key')).toBeNull()
    expect(url.searchParams.get('callback_origin')).toBeNull()
  })

  it('adds optional parameters when provided', () => {
    const url = new URL(
      buildApiKeySignupUrl({
        autoGenerateApiKey: true,
        callbackOrigin: 'https://example.com/cms/outstatic'
      })
    )

    expect(url.searchParams.get('auto_generate_api_key')).toBe('1')
    expect(url.searchParams.get('callback_origin')).toBe(
      'https://example.com/cms/outstatic'
    )
  })
})
