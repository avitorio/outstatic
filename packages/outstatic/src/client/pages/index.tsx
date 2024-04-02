'use client'
import { OutstaticData } from '@/app'
import { OutstaticProvider } from '@/context'
import { useApollo } from '@/utils/apollo'
import { ApolloProvider } from '@apollo/client'
import { ReactElement, useEffect, useState } from 'react'
import FourOhFour from './404'
import AddCustomField from './add-custom-field'
import Collections from './collections'
import EditDocument from './edit-document'
import List from './list'
import Login from './login'
import NewCollection from './new-collection'
import Settings from './settings'
import Welcome from './welcome'
import Onboarding from './onboarding'
import cookies from 'js-cookie'
import { useCollectionsQuery } from '@/graphql/generated'

export type ProviderDataProps = {
  params: { ost: string[] }
  ostData: OutstaticData
}

const defaultPages: { [key: string]: ReactElement | undefined } = {
  settings: <Settings />,
  collections: undefined
}

export const OstClient = ({ ostData, params }: ProviderDataProps) => {
  const [pages, setPages] = useState(ostData?.pages || [])
  const [collections, setCollections] = useState(ostData?.collections || [])
  const {
    repoOwner,
    repoSlug,
    repoBranch,
    monorepoPath,
    contentPath,
    session
  } = ostData
  const client = useApollo(
    ostData?.initialApolloState,
    undefined,
    ostData?.basePath
  )
  const [hasChanges, setHasChanges] = useState(false)

  const { data, loading, error } = useCollectionsQuery({
    client,
    variables: {
      owner: repoOwner || session?.user?.login || '',
      name: repoSlug,
      contentPath:
        `${repoBranch}:${
          monorepoPath ? monorepoPath + '/' : ''
        }${contentPath}` || ''
    },
    fetchPolicy: 'no-cache'
  })

  useEffect(() => {
    if (data) {
      const documentQueryObject = data?.repository?.object

      if (documentQueryObject?.__typename === 'Tree') {
        setCollections(
          documentQueryObject?.entries
            ?.map((entry) => (entry.type === 'tree' ? entry.name : undefined))
            .filter(Boolean) as string[]
        )
      }
    }
  }, [data])

  if (!ostData.repoSlug) {
    const ostSettings = cookies.get('ost_settings')
    if (ostSettings) {
      ostData.repoSlug = JSON.parse(ostSettings).repoSlug
    }
  }

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [hasChanges])

  if (ostData.missingEnvVars) {
    return <Welcome variables={ostData.missingEnvVars} />
  }

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

  if (!session) {
    return <Login />
  }

  const slug = params?.ost?.[0] || ''
  const slug2 = params?.ost?.[1] || ''

  if (loading) {
    return <div>Loading...</div>
  }

  if (slug && ![...pages, ...collections].includes(slug)) {
    return <FourOhFour />
  }

  const isContent = slug && collections.includes(slug)

  return (
    <OutstaticProvider
      {...ostData}
      pages={pages}
      collections={collections}
      setCollections={setCollections}
      addPage={addPage}
      removePage={removePage}
      hasChanges={hasChanges}
      setHasChanges={setHasChanges}
    >
      <ApolloProvider client={client}>
        {!ostData?.repoSlug && <Onboarding />}
        {ostData?.repoSlug && !slug && <Collections />}
        {slug2 && isContent && <EditDocument collection={slug} />}
        {!slug2 && isContent ? <List collection={slug} /> : defaultPages[slug]}
        {(slug === 'collections' && collections.includes(slug2) && (
          <AddCustomField collection={slug2} />
        )) ||
          (!!slug2 && !isContent && <NewCollection />)}
      </ApolloProvider>
    </OutstaticProvider>
  )
}
