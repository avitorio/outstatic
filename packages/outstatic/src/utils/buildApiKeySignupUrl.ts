import { OUTSTATIC_APP_URL } from '@/utils/constants'

type BuildApiKeySignupUrlOptions = {
  autoGenerateApiKey?: boolean
  callbackOrigin?: string
}

export const buildOutstaticCallbackOrigin = (
  origin: string,
  basePath?: string
) => {
  const normalizedBasePath = (basePath ?? '').replace(/\/+$/, '')
  return `${origin}${normalizedBasePath}/outstatic`
}

export const buildApiKeySignupUrl = ({
  autoGenerateApiKey = false,
  callbackOrigin
}: BuildApiKeySignupUrlOptions = {}) => {
  const url = new URL('/auth/sign-up', OUTSTATIC_APP_URL)
  url.searchParams.set('provider', 'github')
  url.searchParams.set('feature', 'api-keys')

  if (autoGenerateApiKey) {
    url.searchParams.set('auto_generate_api_key', '1')
  }

  if (callbackOrigin) {
    url.searchParams.set('callback_origin', callbackOrigin)
  }

  return url.toString()
}
