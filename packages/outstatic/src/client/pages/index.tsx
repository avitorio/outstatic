'use client'
import { OutstaticData } from '@/app'
import { AdminHeader, Sidebar } from '@/components'
import { AdminLoading } from '@/components/AdminLoading'
import { InitialDataContext } from '@/utils/hooks/useInitialData'
import useOutstatic from '@/utils/hooks/useOutstatic'
import { queryClient } from '@/utils/react-query/queryClient'
import { QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { Toaster } from 'sonner'
import { Router } from '../router'
import Login from './login'
import Onboarding from './onboarding'
import Welcome from './welcome'

export const Client = ({
  params
}: {
  ostData: OutstaticData
  params: { ost: string[] }
}) => {
  const { repoSlug, repoOwner, repoBranch, isPending } = useOutstatic()
  const [openSidebar, setOpenSidebar] = useState(false)
  const toggleSidebar = () => {
    setOpenSidebar(!openSidebar)
  }

  return (
    <div id="outstatic">
      <AdminHeader toggleSidebar={toggleSidebar} />
      <div className="flex md:grow flex-col-reverse justify-between md:flex-row md:min-h-[calc(100vh-56px)]">
        {' '}
        <div className="flex w-full">
          <Sidebar isOpen={openSidebar} />
          {isPending ? (
            <AdminLoading />
          ) : !repoSlug || !repoOwner || !repoBranch ? (
            <Onboarding />
          ) : (
            <Router params={params} />
          )}
        </div>
      </div>
    </div>
  )
}

export const OstClient = (props: {
  ostData: OutstaticData
  params: { ost: string[] }
}) => {
  const { ostData } = props

  if (ostData.missingEnvVars) {
    return <Welcome variables={ostData.missingEnvVars} />
  }

  if (!ostData?.session) {
    return <Login />
  }

  return (
    <InitialDataContext.Provider value={ostData}>
      <Toaster richColors />
      <QueryClientProvider client={queryClient}>
        <Client {...props} />
      </QueryClientProvider>
    </InitialDataContext.Provider>
  )
}
