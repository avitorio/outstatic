import { ApolloClient, ApolloProvider } from '@apollo/client'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import { ReactElement, useState } from 'react'
import { OutstaticProvider } from '../context'
import {
  CollectionsDocument,
  CollectionsQuery,
  CollectionsQueryVariables
} from '../graphql/generated'
import { Session } from '../types'
import { initializeApollo, useApollo } from '../utils/apollo'
import { getLoginSession } from '../utils/auth/auth'
import { envVars, EnvVarsType } from '../utils/envVarsCheck'
import FourOhFour from './404'
import NewCollection from './new-collection'
import Collections from './collections'
import EditDocument from './edit-document'
import List from './list'
import Login from './login'
import Settings from './settings'
import Welcome from './welcome'
import AddCustomField from './add-custom-field'

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
  settings: <Settings />,
  collections: undefined
}

export const Outstatic = ({ missingEnvVars, providerData }: OutstaticProps) => {
  const [pages, setPages] = useState(providerData?.pages)
  const [collections, setCollections] = useState(providerData?.collections)
  const router = useRouter()
  const client = useApollo(providerData?.initialApolloState)

  const addPage = (page: string) => {
    if (pages.includes(page)) return
    if (collections.includes(page)) return
    setPages([...pages, page])
    setCollections([...collections, page])
  }

  const removePage = (page: string) => {
    setPages(pages.filter((p) => p !== page))
    setCollections(collections.filter((p) => p !== page))
    console.log('removePage', page)
  }

  if (missingEnvVars) return <Welcome variables={missingEnvVars} />

  const { session } = providerData

  if (!session) {
    return <Login />
  }

  if (!router) {
    return null
  }

  const slug = router.query?.ost?.[0] || ''
  const slug2 = router.query?.ost?.[1] || ''

  if (slug && !pages.includes(slug)) {
    return <FourOhFour />
  }

  const isContent = slug && collections.includes(slug)

  return (
    <OutstaticProvider
      {...providerData}
      pages={pages}
      collections={collections}
      addPage={addPage}
      removePage={removePage}
    >
      <ApolloProvider client={client}>
        {!slug && <Collections />}
        {slug2 && isContent && <EditDocument collection={slug} />}
        {!slug2 && isContent ? <List collection={slug} /> : defaultPages[slug]}
        {slug === 'collections' && collections.includes(slug2) && (
          <AddCustomField collection={slug2} />
        )}
        {!!slug2 && !isContent && <NewCollection />}
      </ApolloProvider>
    </OutstaticProvider>
  )
}

export const OstSSP: GetServerSideProps = async ({ req }) => {
  if (envVars.hasMissingEnvVars) {
    return {
      props: {
        missingEnvVars: envVars.envVars
      }
    }
  }

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

  return {
    props: {
      missingEnvVars: false,
      providerData: {
        repoOwner: process.env.OST_REPO_OWNER || session?.user?.login || '',
        repoSlug: process.env.OST_REPO_SLUG || process.env.VERCEL_GIT_REPO_SLUG,
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
}
