import { Document } from '@/types'

// Outstatic configuration
export const OUTSTATIC_VERSION = '1.5.0-canary.2'
export const OUTSTATIC_URL = 'https://outstatic.com'

// API configuration
export const OUTSTATIC_API_PATH =
  process.env.NEXT_PUBLIC_OST_API_PATH || '/api/outstatic'
export const API_MEDIA_PATH = `${OUTSTATIC_API_PATH}/media/`
export const GITHUB_GQL_API_URL = 'https://api.github.com/graphql'

// Authentication
export const TOKEN_NAME = process.env.NEXT_PUBLIC_OST_TOKEN_NAME || 'ost_token'
export const MAX_AGE = 60 * 60 * 24 * 30 // 30 days
export const TOKEN_SECRET =
  process.env.OST_TOKEN_SECRET || 'l1f3154n4dv3ntur3st4yS7r0n9s3cr3t'

// Document fields
export const DEFAULT_FIELDS: (keyof Document)[] = [
  'author',
  'title',
  'publishedAt',
  'content',
  'status',
  'slug'
]
