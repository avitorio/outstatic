import { EnvVarsType, envVars } from '../utils/envVarsCheck'
import { getLoginSession } from '../utils/auth/auth'
import { initializeApollo } from '../utils/apollo'
import {
  CollectionsDocument,
  CollectionsQuery,
  CollectionsQueryVariables
} from '../graphql/generated'
import { Session } from '../types'

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
}

export const defaultPages = ['settings', 'collections']

export async function Outstatic() {
  if (envVars.hasMissingEnvVars) {
    return {
      missingEnvVars: envVars.envVars
    } as OutstaticData
  }

  const session = await getLoginSession()

  const apolloClient = session ? initializeApollo(null, session) : null

  let collections: String[] = []

  if (apolloClient) {
    try {
      const { data: documentQueryData } = await apolloClient.query<
        CollectionsQuery,
        CollectionsQueryVariables
      >({
        query: CollectionsDocument,
        variables: {
          name:
            process.env.OST_REPO_SLUG ?? process.env.VERCEL_GIT_REPO_SLUG ?? '',
          contentPath: `${process.env.OST_REPO_BRANCH || 'main'}:${
            process.env.OST_MONOREPO_PATH
              ? process.env.OST_MONOREPO_PATH + '/'
              : ''
          }${process.env.OST_CONTENT_PATH || 'outstatic/content'}`,
          owner: process.env.OST_REPO_OWNER || session?.user?.login || ''
        },
        fetchPolicy: 'no-cache'
      })

      const documentQueryObject = documentQueryData?.repository?.object

      if (documentQueryObject?.__typename === 'Tree') {
        collections = documentQueryObject?.entries
          ?.map((entry) => (entry.type === 'tree' ? entry.name : undefined))
          .filter(Boolean) as String[]
      }
    } catch (error) {
      console.log({ error })
    }
  }

  return {
    repoOwner: process.env.OST_REPO_OWNER || session?.user?.login || '',
    repoSlug:
      process.env.OST_REPO_SLUG || process.env.VERCEL_GIT_REPO_SLUG || '',
    repoBranch: process.env.OST_REPO_BRANCH || 'main',
    contentPath: process.env.OST_CONTENT_PATH || 'outstatic/content',
    monorepoPath: process.env.OST_MONOREPO_PATH || '',
    session: session || null,
    initialApolloState: null,
    collections,
    pages: [...defaultPages, ...collections],
    missingEnvVars: false
  } as OutstaticData
}
