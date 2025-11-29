import { cache } from 'react'
import { LoginSession, getLoginSession } from '@/utils/auth/auth'
import { OST_PRO_API_KEY, OST_PRO_API_URL } from '@/utils/constants'
import { EnvVarsType, envVars } from '@/utils/envVarsCheck'
import {
  getCachedProjectInfo,
  setCachedProjectInfo,
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
  hasOpenAIKey: boolean
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
  }
}

/**
 * Get project info with caching
 * Uses React's cache() for request-level memoization and in-memory cache for cross-request caching
 */
const getProjectInfoWithCache = cache(
  async (
    apiKey: string,
    apiUrl: string | undefined
  ): Promise<ProjectInfo | undefined> => {
    // Check in-memory cache first (cross-request caching)
    const cachedProjectInfo = getCachedProjectInfo(apiKey)
    if (cachedProjectInfo) {
      return cachedProjectInfo
    }

    // Cache miss - perform handshake
    try {
      const apiBase = apiUrl?.endsWith('/') ? apiUrl : `${apiUrl ?? ''}/`
      const handshakeUrl = new URL('outstatic/project', apiBase)

      const response = await fetch(handshakeUrl.href, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        }
      })

      if (response.ok) {
        const data = await response.json()
        const projectInfo: ProjectInfo = {
          projectId: data.project_id,
          projectSlug: data.project_slug,
          accountSlug: data.account_slug,
        }

        // Cache the result for future requests (in-memory cache)
        if (projectInfo.projectId) {
          setCachedProjectInfo(apiKey, projectInfo)
        }

        return projectInfo
      } else {
        // Log error but don't fail - allow Outstatic to work without projectInfo
        console.warn(
          `Failed to get project info from handshake: ${response.status} ${response.statusText}`
        )
        return undefined
      }
    } catch (error) {
      // Log error but don't fail - allow Outstatic to work without projectInfo
      console.warn('Error during project handshake:', error)
      return undefined
    }
  }
)

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
    OST_CONTENT_PATH: `${repoBranch || process.env.OST_REPO_BRANCH}:${process.env.OST_MONOREPO_PATH ? process.env.OST_MONOREPO_PATH + '/' : ''
      }${process.env.OST_CONTENT_PATH || ''}`,
    OST_MONOREPO_PATH: '',
    OST_BASE_PATH: ''
  }

  if (envVars.hasMissingEnvVars && !ostConfig.OST_REPO_OWNER) {
    return {
      missingEnvVars: envVars.envVars
    } as OutstaticData
  }

  const session = await getLoginSession()

  // Perform handshake to get project info if API key is present
  // Uses both in-memory cache (cross-request) and React cache (per-request)
  const projectInfo = OST_PRO_API_KEY
    ? await getProjectInfoWithCache(OST_PRO_API_KEY, OST_PRO_API_URL)
    : undefined

  return {
    repoOwner: ostConfig.OST_REPO_OWNER,
    repoSlug: ostConfig.OST_REPO_SLUG,
    repoBranch: ostConfig.OST_REPO_BRANCH,
    ostPath: process.env.OST_OUTSTATIC_PATH || 'outstatic',
    contentPath: process.env.OST_CONTENT_PATH || 'outstatic/content',
    monorepoPath: process.env.OST_MONOREPO_PATH || '',
    session: session || null,
    missingEnvVars: false,
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    basePath: process.env.OST_BASE_PATH || '',
    ostDetach: process.env.OST_DETACH || false,
    pages: ['collections', 'settings', 'media-library'],
    dashboardRoute: '/outstatic',
    githubGql: session?.provider !== 'github' ? `${OST_PRO_API_URL}/github/parser` : 'https://api.github.com/graphql',
    publicMediaPath: process.env.OST_PUBLIC_MEDIA_PATH || '',
    repoMediaPath: process.env.OST_REPO_MEDIA_PATH || '',
    isPro: !!OST_PRO_API_KEY && !!projectInfo,
    projectInfo: projectInfo ? {
      projectId: projectInfo.projectId,
      projectSlug: projectInfo.projectSlug,
      accountSlug: projectInfo.accountSlug,
    } : undefined
  } as OutstaticData
}
