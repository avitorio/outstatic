import { getLoginSession, type LoginSession } from '@/utils/auth/auth'
import { OUTSTATIC_API_KEY, OUTSTATIC_API_URL } from '@/utils/constants'
import type { EnvVarsType } from '@/utils/env-vars-check'
import {
  createCachedHandshake,
  type ProjectInfo
} from '@/utils/cache/project-handshake-cache'

const DEFAULT_OST_PATH = 'outstatic'
const DEFAULT_CONTENT_PATH = 'outstatic/content'
const DEFAULT_DASHBOARD_ROUTE = '/outstatic'
const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql'
const DEFAULT_PAGES = ['collections', 'settings', 'media-library', 'singletons']

type OutstaticOptions = {
  repoOwner?: string
  repoSlug?: string
  repoBranch?: string
}

export type OutstaticData = {
  repoOwner: string
  repoSlug: string
  repoBranch: string
  contentPath: string
  monorepoPath: string
  ostPath: string
  session: LoginSession | null
  pages: string[]
  missingEnvVars: EnvVarsType | false
  hasAIProviderKey: boolean
  basePath: string
  ostDetach: boolean
  ostContent?: string
  dashboardRoute: string
  githubGql: string
  publicMediaPath: string
  repoMediaPath: string
  isPro: boolean
  projectInfo?: {
    projectId: string
    projectSlug: string
    accountSlug: string
    repoOwner: string
    repoSlug: string
  }
}

/**
 * Fetcher function for project handshake API
 * This is the underlying fetch logic that will be wrapped with multi-layer caching
 */
async function fetchProjectFromHandshake(
  apiKey: string
): Promise<ProjectInfo | null> {
  try {
    const apiBase = OUTSTATIC_API_URL.endsWith('/')
      ? OUTSTATIC_API_URL
      : `${OUTSTATIC_API_URL}/`
    const handshakeUrl = new URL('outstatic/project', apiBase)

    const response = await fetch(handshakeUrl.href, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`
      },
      cache: 'no-store' // Prevent double-caching at fetch level
    })

    if (!response.ok) {
      // Log error but don't fail - allow Outstatic to work without projectInfo
      console.warn(
        `Failed to get project info from handshake: ${response.status} ${response.statusText}`
      )
      return null
    }

    const data = await response.json()
    return {
      projectId: data.project_id,
      projectSlug: data.project_slug,
      accountSlug: data.account_slug,
      repoOwner: data.repo_owner,
      repoSlug: data.repo_slug,
      isPro: data.is_pro
    }
  } catch (error) {
    // Log error but don't fail - allow Outstatic to work without projectInfo
    console.warn('Error during project handshake:', error)
    return null
  }
}

/**
 * Get project info with multi-layer caching
 *
 * Three-layer caching strategy:
 * 1. React cache() - Request-level deduplication
 * 2. In-memory Map - Fast access for warm containers
 * 3. Next.js unstable_cache - Persistent cache across cold starts
 */
const getProjectInfoWithCache = createCachedHandshake(fetchProjectFromHandshake)

export async function Outstatic({
  repoOwner = '',
  repoSlug = '',
  repoBranch = ''
}: OutstaticOptions = {}): Promise<OutstaticData> {
  // Handshake and session are independent, so resolve them together.
  const [session, projectInfo] = await Promise.all([
    getLoginSession(),
    OUTSTATIC_API_KEY
      ? getProjectInfoWithCache(OUTSTATIC_API_KEY)
      : Promise.resolve(null)
  ])

  const resolvedRepoOwner =
    projectInfo?.repoOwner || repoOwner || process.env.OST_REPO_OWNER || ''
  const resolvedRepoSlug =
    projectInfo?.repoSlug ||
    repoSlug ||
    process.env.OST_REPO_SLUG ||
    process.env.VERCEL_GIT_REPO_SLUG ||
    ''
  const resolvedRepoBranch = repoBranch || process.env.OST_REPO_BRANCH || ''

  return {
    repoOwner: resolvedRepoOwner,
    repoSlug: resolvedRepoSlug,
    repoBranch: resolvedRepoBranch,
    ostPath: process.env.OST_OUTSTATIC_PATH || DEFAULT_OST_PATH,
    contentPath: process.env.OST_CONTENT_PATH || DEFAULT_CONTENT_PATH,
    monorepoPath: process.env.OST_MONOREPO_PATH || '',
    session: session || null,
    missingEnvVars: false,
    hasAIProviderKey:
      !!process.env.OPENAI_API_KEY || !!process.env.AI_GATEWAY_API_KEY,
    basePath: process.env.OST_BASE_PATH || '',
    ostDetach: !!process.env.OST_DETACH,
    pages: DEFAULT_PAGES,
    dashboardRoute: DEFAULT_DASHBOARD_ROUTE,
    githubGql:
      session?.provider === 'github'
        ? GITHUB_GRAPHQL_URL
        : `${OUTSTATIC_API_URL}/github/parser`,
    publicMediaPath: process.env.OST_PUBLIC_MEDIA_PATH || '',
    repoMediaPath: process.env.OST_REPO_MEDIA_PATH || '',
    isPro: projectInfo?.isPro || false,
    projectInfo: projectInfo
      ? {
          projectId: projectInfo.projectId,
          projectSlug: projectInfo.projectSlug,
          accountSlug: projectInfo.accountSlug,
          repoOwner: projectInfo.repoOwner,
          repoSlug: projectInfo.repoSlug
        }
      : undefined
  }
}
