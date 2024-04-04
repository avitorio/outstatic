import {
  CollectionsDocument,
  CollectionsQuery,
  CollectionsQueryVariables
} from '@/graphql/generated'
import { Session } from '@/types'
import { initializeApollo } from '@/utils/apollo'
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
  collections: string[]
  pages: string[]
  missingEnvVars: EnvVarsType | false
  hasOpenAIKey: boolean
  basePath: string
}

export const defaultPages = ['settings', 'collections']

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
  const apolloClient = session
    ? initializeApollo(null, session, process.env.OST_BASE_PATH)
    : null

  ostConfig.OST_REPO_OWNER =
    repoOwner || process.env.OST_REPO_OWNER || session?.user?.login || ''

  let collections: string[] = []

  if (apolloClient && ostConfig.OST_REPO_SLUG) {
    try {
      const { data: documentQueryData } = await apolloClient.query<
        CollectionsQuery,
        CollectionsQueryVariables
      >({
        query: CollectionsDocument,
        variables: {
          name: ostConfig.OST_REPO_SLUG,
          contentPath: ostConfig.OST_CONTENT_PATH,
          owner: ostConfig.OST_REPO_OWNER
        },
        fetchPolicy: 'no-cache'
      })

      const documentQueryObject = documentQueryData?.repository?.object

      if (documentQueryObject?.__typename === 'Tree') {
        collections = documentQueryObject?.entries
          ?.map((entry) => (entry.type === 'tree' ? entry.name : undefined))
          .filter(Boolean) as string[]
      }
    } catch (error) {
      console.log({ error })
    }
  }

  return {
    repoOwner: ostConfig.OST_REPO_OWNER,
    repoSlug: ostConfig.OST_REPO_SLUG,
    repoBranch: ostConfig.OST_REPO_BRANCH,
    contentPath: process.env.OST_CONTENT_PATH || 'outstatic/content',
    monorepoPath: process.env.OST_MONOREPO_PATH || '',
    session: session || null,
    initialApolloState: null,
    collections,
    pages: [...defaultPages, ...collections],
    missingEnvVars: false,
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    basePath: process.env.OST_BASE_PATH || ''
  } as OutstaticData
}
