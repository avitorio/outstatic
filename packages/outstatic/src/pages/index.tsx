import { ApolloClient, ApolloProvider } from '@apollo/client'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import { ReactElement, useState } from 'react'
import { OutstaticProvider } from '../context'
import { ContentTypesDocument } from '../graphql/generated'
import { Session } from '../types'
import { initializeApollo, useApollo } from '../utils/apollo'
import { getLoginSession } from '../utils/auth/auth'
import { hasMissingEnvVar, missingEnvVars } from '../utils/envVarsCheck'
import FourOhFour from './404'
import ContentTypes from './content-types'
import Dashboard from './dashboard'
import EditContent from './edit-content'
import List from './list'
import Login from './login'
import Settings from './settings'
import Welcome from './welcome'

type OutstaticProps = {
  missingEnvVars: boolean[]
  providerData: {
    client: ApolloClient<any>
    repoSlug: string
    contentPath: string
    monorepoPath: string
    session: Session | null
    initialApolloState?: null
    contentTypes: string[]
    pages: string[]
  }
}

const defaultPages: { [key: string]: ReactElement | undefined } = {
  settings: <Settings />,
  'content-types': undefined
}

export const Outstatic = ({ missingEnvVars, providerData }: OutstaticProps) => {
  const [pages, setPages] = useState(providerData?.pages)
  const [contentTypes, setContentTypes] = useState(providerData?.contentTypes)
  const router = useRouter()
  const client = useApollo(providerData?.initialApolloState)

  const addPage = (page: string) => {
    if (pages.includes(page)) return
    if (contentTypes.includes(page)) return
    setPages([...pages, page])
    setContentTypes([...contentTypes, page])
  }

  const removePage = (page: string) => {
    setPages(pages.filter((p) => p !== page))
    setContentTypes(contentTypes.filter((p) => p !== page))
    console.log('removePage', page)
  }

  if (missingEnvVars.length > 0) return <Welcome variables={missingEnvVars} />

  const { session } = providerData

  if (!session) {
    return <Login />
  }

  const slug = router.query?.ost?.[0] || ''
  const slug2 = router.query?.ost?.[1] || ''

  if (slug && !pages.includes(slug)) {
    return <FourOhFour />
  }

  const isContent = slug && contentTypes.includes(slug)

  return (
    <OutstaticProvider
      {...providerData}
      pages={pages}
      contentTypes={contentTypes}
      addPage={addPage}
      removePage={removePage}
    >
      <ApolloProvider client={client}>
        {!slug && <Dashboard />}
        {slug2 && isContent && <EditContent contentType={slug} />}
        {!slug2 && isContent ? <List contentType={slug} /> : defaultPages[slug]}
        {!!slug2 && !isContent && <ContentTypes />}
      </ApolloProvider>
    </OutstaticProvider>
  )
}

export const OstSSP: GetServerSideProps = async ({ req }) => {
  if (hasMissingEnvVar) {
    return {
      props: {
        missingEnvVars
      }
    }
  }

  const session = await getLoginSession(req)

  const apolloClient = session ? initializeApollo(null, session) : null

  let contentTypes: String[] = []

  if (apolloClient) {
    const { data: postQueryData } = await apolloClient.query({
      query: ContentTypesDocument,
      variables: {
        name: process.env.OST_REPO_SLUG,
        contentPath: `HEAD:${
          process.env.OST_MONOREPO_PATH
            ? process.env.OST_MONOREPO_PATH + '/'
            : ''
        }${process.env.OST_CONTENT_PATH || 'outstatic/content'}`,
        owner: session?.user?.name
      }
    })

    const postQueryObject = postQueryData?.repository?.object

    if (postQueryObject?.__typename === 'Tree') {
      contentTypes = postQueryObject?.entries?.map(
        (entry: { name: any }) => entry.name
      ) as String[]
    }
  }

  return {
    props: {
      missingEnvVars: [],
      providerData: {
        repoSlug: process.env.OST_REPO_SLUG,
        contentPath: process.env.OST_CONTENT_PATH || 'outstatic/content',
        monorepoPath: process.env.OST_MONOREPO_PATH || '',
        session: session || null,
        initialApolloState: apolloClient?.cache.extract() || null,
        contentTypes,
        pages: [...Object.keys(defaultPages), ...contentTypes]
      }
    }
  }
}
