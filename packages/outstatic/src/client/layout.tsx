import { ReactNode, useState } from 'react'
import { OutstaticData } from '@/app'
import { OutstaticProvider } from '@/context'
import { useContentLock } from '@/utils/hooks/useContentLock'
import { useApollo } from '@/utils/apollo'
import { ApolloProvider } from '@apollo/client'
import cookies from 'js-cookie'
import { Sidebar, AdminHeader } from '@/components'

const Layout = ({
  children,
  ostData
}: {
  children: ReactNode
  ostData: OutstaticData
}) => {
  const client = useApollo(
    ostData?.initialApolloState,
    undefined,
    ostData?.basePath
  )
  const [pages, setPages] = useState(ostData?.pages || [])
  const [collections, setCollections] = useState(ostData?.collections || [])
  const [openSidebar, setOpenSidebar] = useState(false)
  const toggleSidebar = () => {
    setOpenSidebar(!openSidebar)
  }

  if (!ostData.repoSlug) {
    const ostSettings = cookies.get('ost_settings')
    if (ostSettings) {
      ostData.repoSlug = JSON.parse(ostSettings).repoSlug
    }
  }

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
          <div className="flex h-screen flex-col bg-white text-black">
            <div className="flex md:grow flex-col-reverse justify-between md:flex-row">
              <div className="flex w-full">
                <Sidebar isOpen={openSidebar} ostData={ostData} />
                {children}
              </div>
            </div>
          </div>
        </OutstaticProvider>
      </ApolloProvider>
    </div>
  )
}

export default Layout
