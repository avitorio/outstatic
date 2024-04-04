'use client'
import { useEffect, useState } from 'react'
import { OutstaticData } from '@/app'
import { OutstaticProvider } from '@/context'
import { useContentLock } from '@/utils/hooks/useContentLock'
import { useApollo } from '@/utils/apollo'
import { ApolloProvider } from '@apollo/client'
import cookies from 'js-cookie'
import { AdminHeader, Sidebar } from '@/components'
import { Router } from '../router'
import Welcome from './welcome'
import Login from './login'
import { useCollectionsQuery } from '@/graphql/generated'

export const OstClient = ({
  ostData,
  params
}: {
  ostData: OutstaticData
  params: { ost: string[] }
}) => {
  const client = useApollo(
    ostData?.initialApolloState,
    undefined,
    ostData?.basePath
  )

  const ostSettings = JSON.parse(cookies.get('ost_settings') || '{}')
  const [pages, setPages] = useState(ostData?.pages || [])
  const [collections, setCollections] = useState<string[]>(
    (ostData?.collections.length > 0 && ostData.collections) ||
      ostSettings?.collections ||
      []
  )
  const [openSidebar, setOpenSidebar] = useState(false)
  const toggleSidebar = () => {
    setOpenSidebar(!openSidebar)
  }

  const { repoSlug, repoOwner, monorepoPath, repoBranch, contentPath } = ostData

  const { data, loading } = useCollectionsQuery({
    client,
    variables: {
      owner: repoOwner,
      name: ostData.repoSlug,
      contentPath:
        `${repoBranch}:${
          monorepoPath ? monorepoPath + '/' : ''
        }${contentPath}` || ''
    },
    skip: !repoSlug,
    fetchPolicy: 'no-cache'
  })

  if (!repoSlug) {
    if (ostSettings) {
      ostData.repoSlug = ostSettings?.repoSlug
    }
  }

  useEffect(() => {
    if (data) {
      const documentQueryObject = data?.repository?.object
      if (documentQueryObject?.__typename === 'Tree') {
        const newCollections = documentQueryObject?.entries
          ?.map((entry) => (entry.type === 'tree' ? entry.name : undefined))
          .filter(Boolean) as string[]
        setCollections(newCollections)
        cookies.set(
          'ost_settings',
          JSON.stringify({ ...ostSettings, collections: newCollections })
        )
      }
    }
  }, [data])

  const { hasChanges, setHasChanges } = useContentLock()

  const addPage = (page: string) => {
    if (pages.includes(page)) return
    if (collections.includes(page)) return
    setPages([...pages, page])
    setCollections([...collections, page])
  }

  const removePage = (page: string) => {
    setPages((prev) => prev.filter((p) => p !== page))
    setCollections((prev) => prev.filter((p) => p !== page))
    console.log('removePage', page)
  }

  if (ostData.missingEnvVars) {
    return <Welcome variables={ostData.missingEnvVars} />
  }

  const { session } = ostData

  if (!session) {
    return <Login />
  }

  return (
    <div id="outstatic">
      <ApolloProvider client={client}>
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
          <AdminHeader toggleSidebar={toggleSidebar} />
          <div className="flex md:grow flex-col-reverse justify-between md:flex-row md:min-h-[calc(100vh-56px)]">
            <div className="flex w-full">
              <Sidebar isOpen={openSidebar} loading={loading} />
              <Router params={params} />
            </div>
          </div>
        </OutstaticProvider>
      </ApolloProvider>
    </div>
  )
}
