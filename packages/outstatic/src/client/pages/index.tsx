import { ApolloClient, ApolloProvider } from '@apollo/client'
import { Session } from '../../types'
import { ReactElement, useState } from 'react'
import { useApollo } from '../../utils/apollo'
import Login from '../../pages/login'
import FourOhFour from '../../pages/404'
import { OutstaticProvider } from '../../context'
import Collections from '../../pages/collections'
import EditDocument from '../../pages/edit-document'
import List from '../../pages/list'
import AddCustomField from '../../pages/add-custom-field'
import NewCollection from '../../pages/new-collection'
import Settings from '../../app/settings'

export type ProviderDataProps = {
  params: { slug: string[] }
  providerData: {
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

export const OstClient = ({ providerData, params }: ProviderDataProps) => {
  const [pages, setPages] = useState(providerData?.pages)
  const [collections, setCollections] = useState(providerData?.collections)

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

  const { session } = providerData

  if (!session) {
    return <Login />
  }

  console.log({ params })

  if (!params.slug) {
    return null
  }

  const slug = params.slug[0] || ''
  const slug2 = params.slug[1] || ''

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
        {(slug === 'collections' && collections.includes(slug2) && (
          <AddCustomField collection={slug2} />
        )) ||
          (!!slug2 && !isContent && <NewCollection />)}
      </ApolloProvider>
    </OutstaticProvider>
  )
}
