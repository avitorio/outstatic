import { Session } from '@/types'
import { getLoginSession } from '@/utils/auth/auth'
import { EnvVarsType, envVars } from '@/utils/envVarsCheck'

export type OutstaticData = {
  repoOwner: string
  repoSlug: string
  repoBranch: string
  contentPath: string
  monorepoPath: string
  session: Session | null
  initialApolloState?: null
  pages: string[]
  missingEnvVars: EnvVarsType | false
  hasOpenAIKey: boolean
  basePath: string
}

export async function Outstatic({
  repoOwner = '',
  repoSlug = '',
  repoBranch = 'main'
}: { repoOwner?: string; repoSlug?: string; repoBranch?: string } = {}) {
  const ostConfig = {
    OST_REPO_OWNER: repoOwner,
    OST_REPO_SLUG:
      repoSlug ||
      process.env.OST_REPO_SLUG ||
      process.env.VERCEL_GIT_REPO_SLUG ||
      '',
    OST_REPO_BRANCH: repoBranch || process.env.OST_REPO_BRANCH || 'main',
    OST_CONTENT_PATH: `${process.env.OST_REPO_BRANCH || 'main'}:${
      process.env.OST_MONOREPO_PATH ? process.env.OST_MONOREPO_PATH + '/' : ''
    }${process.env.OST_CONTENT_PATH || 'outstatic/content'}`,
    OST_MONOREPO_PATH: '',
    OST_BASE_PATH: ''
  }

  if (envVars.hasMissingEnvVars && !ostConfig.OST_REPO_OWNER) {
    return {
      missingEnvVars: envVars.envVars
    } as OutstaticData
  }

  const session = await getLoginSession()

  ostConfig.OST_REPO_OWNER =
    repoOwner || process.env.OST_REPO_OWNER || session?.user?.login || ''

  return {
    repoOwner: ostConfig.OST_REPO_OWNER,
    repoSlug: ostConfig.OST_REPO_SLUG,
    repoBranch: ostConfig.OST_REPO_BRANCH,
    contentPath: process.env.OST_CONTENT_PATH || 'outstatic/content',
    monorepoPath: process.env.OST_MONOREPO_PATH || '',
    session: session || null,
    initialApolloState: null,
    missingEnvVars: false,
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    basePath: process.env.OST_BASE_PATH || ''
  } as OutstaticData
}
