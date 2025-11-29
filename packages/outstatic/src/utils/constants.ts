import { Document } from '@/types'

// Outstatic configuration
export const OUTSTATIC_VERSION = '2.0.10'
export const OUTSTATIC_URL = 'https://outstatic.com'
export const OUTSTATIC_APP_URL = process.env.NEXT_PUBLIC_OST_APP_URL ?? `http://app.outstatic.com`

// Pro API configuration (server-side only)
export const OST_PRO_API_KEY = process.env.OST_PRO_API_KEY
export const OST_PRO_API_URL = process.env.OST_PRO_API_URL || `${OUTSTATIC_APP_URL}/api`

// API configuration
export const OUTSTATIC_API_PATH =
  process.env.NEXT_PUBLIC_OST_API_PATH || '/api/outstatic'
export const API_MEDIA_PATH = `${OUTSTATIC_API_PATH}/media/`
export const GITHUB_GQL_API_URL = `${OUTSTATIC_API_PATH}/github-graphql`

// Authentication
export const TOKEN_NAME = process.env.NEXT_PUBLIC_OST_TOKEN_NAME || 'ost_token'
export const MAX_AGE = 60 * 60 * 24 * 30 // 30 days
export const TOKEN_SECRET =
  process.env.OST_TOKEN_SECRET || 'l1f3154n4dv3ntur3st4yS7r0n9s3cr3t'

// Cookie settings
export const COOKIE_SETTINGS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  sameSite: 'lax' as const
} as const

// Session validation
export const SESSION_ERROR_MESSAGES = {
  INVALID_SESSION: 'Invalid session data',
  SESSION_EXPIRED: 'Session expired',
  INVALID_STRUCTURE: 'Invalid session structure detected'
} as const

// Document fields
export const DEFAULT_FIELDS: (keyof Document)[] = [
  'author',
  'title',
  'publishedAt',
  'content',
  'status',
  'slug'
]
