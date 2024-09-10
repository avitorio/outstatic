export const OUTSTATIC_VERSION = '1.4.9'
export const OUTSTATIC_URL = 'https://outstatic.com'
export const IMAGES_PATH = 'images/'
export const OUTSTATIC_API_PATH =
  process.env.NEXT_PUBLIC_OST_API_PATH || '/api/outstatic'
export const API_IMAGES_PATH = `${OUTSTATIC_API_PATH}/${IMAGES_PATH}`
export const GITHUB_GQL_API_URL = 'https://api.github.com/graphql'
export const TOKEN_NAME = process.env.NEXT_PUBLIC_OST_TOKEN_NAME || 'ost_token'
export const MAX_AGE = 60 * 60 * 24 * 30 // 30 days
export const TOKEN_SECRET =
  process.env.OST_TOKEN_SECRET || 'l1f3154n4dv3ntur3st4yS7r0n9s3cr3t'
