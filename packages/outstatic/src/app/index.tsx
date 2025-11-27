import { LoginSession, getLoginSession } from '@/utils/auth/auth'
import { OST_PRO_API_KEY, OST_PRO_API_URL } from '@/utils/constants'
import { EnvVarsType, envVars } from '@/utils/envVarsCheck'

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
  projectId?: string
}

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

  // Perform handshake to get project ID if API key is present
  let projectId: string | undefined
  if (OST_PRO_API_KEY) {
    try {
      const apiBase = OST_PRO_API_URL?.endsWith('/')
        ? OST_PRO_API_URL
        : `${OST_PRO_API_URL ?? ''}/`
      const handshakeUrl = new URL('outstatic/project', apiBase)

      const response = await fetch(handshakeUrl.href, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${OST_PRO_API_KEY}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        projectId = data.project_id
      } else {
        // Log error but don't fail - allow Outstatic to work without projectId
        console.warn(
          `Failed to get project ID from handshake: ${response.status} ${response.statusText}`
        )
      }
    } catch (error) {
      // Log error but don't fail - allow Outstatic to work without projectId
      console.warn('Error during project handshake:', error)
    }
  }

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
    isPro: !!OST_PRO_API_KEY,
    projectId
  } as OutstaticData
}
