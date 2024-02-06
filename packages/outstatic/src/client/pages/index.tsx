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
  const client = useApollo(ostData?.initialApolloState)
  const [hasChanges, setHasChanges] = useState(false)

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

  const { session } = ostData

  if (!session) {
    return <Login />
  }

  const slug = params?.ost?.[0] || ''
  const slug2 = params?.ost?.[1] || ''

  if (slug && !pages.includes(slug)) {
    return <FourOhFour />
  }

  const isContent = slug && collections.includes(slug)

  return (
    <OutstaticProvider
      {...ostData}
      pages={pages}
      collections={collections}
      addPage={addPage}
      removePage={removePage}
      hasChanges={hasChanges}
      setHasChanges={setHasChanges}
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
