import { ApolloClient, ApolloProvider } from '@apollo/client'
import { Session } from '../types'
import { cookies, headers } from 'next/headers'
import { envVars, EnvVarsType } from '../utils/envVarsCheck'
import Welcome from './welcome'
import { getLoginSession } from '../utils/auth/auth'
import { initializeApollo } from '../utils/apollo'
import {
  CollectionsDocument,
  CollectionsQuery,
  CollectionsQueryVariables
} from '../graphql/generated'
import { JSXElementConstructor, ReactElement, useState } from 'react'
import Settings from './settings'
import { ProviderDataProps } from '../client/pages'

type OutstaticProps = {
  missingEnvVars: EnvVarsType | false
  providerData: {
    client: ApolloClient<any>
    repoOwner: string
    repoSlug: string
    repoBranch: string
    contentPath: string
    monorepoPath: string
    session: Session | null
    initialApolloState?: null
    collections: string[]
    pages: string[]
  }
}

const defaultPages: { [key: string]: ReactElement | undefined } = {
  collections: undefined
}

export async function Outstatic() {
  const { missingEnvVars, providerData } = await OstSSR()

  if (missingEnvVars)
    return <Welcome variables={missingEnvVars as EnvVarsType} />

  return providerData
}

export async function OstSSR() {
  if (envVars.hasMissingEnvVars) {
    return {
      missingEnvVars: envVars.envVars
    }
  }

  const cookieStore = cookies()
  const ost_token = cookieStore.get('ost_token')

  console.log({ ost_token })
  const req = {
    cookies: {
      ost_token: ost_token?.value || ''
    },
    headers: {
      cookie: cookies().get('ost_token') || ''
    }
  }

  console.log({ req })

  const session = await getLoginSession(req)

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
        }
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

  console.log(apolloClient)

  return {
    missingEnvVars: false,
    providerData: {
      repoOwner: process.env.OST_REPO_OWNER || session?.user?.login || '',
      repoSlug:
        process.env.OST_REPO_SLUG || process.env.VERCEL_GIT_REPO_SLUG || '',
      repoBranch: process.env.OST_REPO_BRANCH || 'main',
      contentPath: process.env.OST_CONTENT_PATH || 'outstatic/content',
      monorepoPath: process.env.OST_MONOREPO_PATH || '',
      session: session || null,
      initialApolloState: apolloClient?.cache.extract() || null,
      collections,
      pages: [...Object.keys(defaultPages), ...collections]
    }
  }
}
