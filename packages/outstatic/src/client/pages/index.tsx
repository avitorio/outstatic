'use client'
import { useState } from 'react'
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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Create a client
const queryClient = new QueryClient()

export const Client = ({
  ostData,
  params
}: {
  ostData: OutstaticData
  params: { ost: string[] }
}) => {
  const [openSidebar, setOpenSidebar] = useState(false)
  const toggleSidebar = () => {
    setOpenSidebar(!openSidebar)
  }

  const client = useApollo(
    ostData?.initialApolloState,
    undefined,
    ostData?.basePath
  )

  return (
    <div id="outstatic">
      <ApolloProvider client={client}>
        <AdminHeader toggleSidebar={toggleSidebar} />
        <div className="flex md:grow flex-col-reverse justify-between md:flex-row md:min-h-[calc(100vh-56px)]">
          <div className="flex w-full">
            <Sidebar isOpen={openSidebar} />
            <Router params={params} />
          </div>
        </div>
      </ApolloProvider>
    </div>
  )
}

export const OstClient = (props: {
  ostData: OutstaticData
  params: { ost: string[] }
}) => {
  const { ostData } = props
  const ostSettings = JSON.parse(cookies.get('ost_settings') || '{}')

  if (!ostData.repoSlug) {
    if (ostSettings) {
      ostData.repoSlug = ostSettings?.repoSlug
    }
  }

  const { hasChanges, setHasChanges } = useContentLock()

  if (ostData.missingEnvVars) {
    return <Welcome variables={ostData.missingEnvVars} />
  }

  if (!ostData?.session) {
    return <Login />
  }
  return (
    <OutstaticProvider
      {...ostData}
      hasChanges={hasChanges}
      setHasChanges={setHasChanges}
    >
      <QueryClientProvider client={queryClient}>
        <Client {...props} />
      </QueryClientProvider>
    </OutstaticProvider>
  )
}
