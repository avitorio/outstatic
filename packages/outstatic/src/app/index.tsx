import { LoginSession, getLoginSession } from '@/utils/auth/auth'
import { OUTSTATIC_API_KEY, OUTSTATIC_API_URL } from '@/utils/constants'
import { EnvVarsType } from '@/utils/envVarsCheck'
import {
  createCachedHandshake,
  type ProjectInfo
} from '@/utils/cache/project-handshake-cache'

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
    const apiUrl = OUTSTATIC_API_URL
    const apiBase = apiUrl?.endsWith('/') ? apiUrl : `${apiUrl ?? ''}/`
    const handshakeUrl = new URL('outstatic/project', apiBase)

    const response = await fetch(handshakeUrl.href, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`
      },
      cache: 'no-store' // Prevent double-caching at fetch level
    })

    if (response.ok) {
      const data = await response.json()
      return {
        projectId: data.project_id,
        projectSlug: data.project_slug,
        accountSlug: data.account_slug,
        repoOwner: data.repo_owner,
        repoSlug: data.repo_slug,
        isPro: data.is_pro
      }
    } else {
      // Log error but don't fail - allow Outstatic to work without projectInfo
      console.warn(
        `Failed to get project info from handshake: ${response.status} ${response.statusText}`
      )
      return null
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
}: { repoOwner?: string; repoSlug?: string; repoBranch?: string } = {}) {
  const ostConfig = {
    OST_REPO_OWNER: repoOwner || process.env.OST_REPO_OWNER || '',
    OST_REPO_SLUG:
      repoSlug ||
      process.env.OST_REPO_SLUG ||
      process.env.VERCEL_GIT_REPO_SLUG ||
      '',
    OST_REPO_BRANCH: repoBranch || process.env.OST_REPO_BRANCH,
    OST_CONTENT_PATH: `${repoBranch || process.env.OST_REPO_BRANCH}:${
      process.env.OST_MONOREPO_PATH ? process.env.OST_MONOREPO_PATH + '/' : ''
    }${process.env.OST_CONTENT_PATH || ''}`,
    OST_MONOREPO_PATH: '',
    OST_BASE_PATH: ''
  }

  const session = await getLoginSession()

  // Perform handshake to get project info if API key is present
  // Uses multi-layer caching: React cache (per-request) + in-memory + Next.js unstable_cache
  const projectInfo = OUTSTATIC_API_KEY
    ? await getProjectInfoWithCache(OUTSTATIC_API_KEY)
    : undefined

  return {
    repoOwner: projectInfo?.repoOwner || ostConfig.OST_REPO_OWNER,
    repoSlug: projectInfo?.repoSlug || ostConfig.OST_REPO_SLUG,
    repoBranch: ostConfig.OST_REPO_BRANCH,
    ostPath: process.env.OST_OUTSTATIC_PATH || 'outstatic',
    contentPath: process.env.OST_CONTENT_PATH || 'outstatic/content',
    monorepoPath: process.env.OST_MONOREPO_PATH || '',
    session: session || null,
    missingEnvVars: false,
    hasAIProviderKey:
      !!process.env.OPENAI_API_KEY || !!process.env.AI_GATEWAY_API_KEY,
    basePath: process.env.OST_BASE_PATH || '',
    ostDetach: process.env.OST_DETACH || false,
    pages: ['collections', 'settings', 'media-library', 'singletons'],
    dashboardRoute: '/outstatic',
    githubGql:
      session?.provider !== 'github'
        ? `${OUTSTATIC_API_URL}/github/parser`
        : 'https://api.github.com/graphql',
    publicMediaPath: process.env.OST_PUBLIC_MEDIA_PATH || '',
    repoMediaPath: process.env.OST_REPO_MEDIA_PATH || '',
    isPro: projectInfo?.isPro || false,
    projectInfo: projectInfo
      ? {
          projectId: projectInfo.projectId,
          projectSlug: projectInfo.projectSlug,
          accountSlug: projectInfo.accountSlug
        }
      : undefined
  } as OutstaticData
}
