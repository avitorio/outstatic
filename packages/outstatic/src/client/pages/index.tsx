'use client'
import { OutstaticData } from '@/app'
import { AdminHeader, Sidebar } from '@/components'
import { AdminLoading } from '@/components/AdminLoading'
import { OutstaticProvider } from '@/context'
import { useContentLock } from '@/utils/hooks/useContentLock'
import { useInitialData, useOutstaticNew } from '@/utils/hooks/useOstData'
import { queryClient } from '@/utils/react-query/queryClient'
import { QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { Toaster } from 'sonner'
import { Router } from '../router'
import Login from './login'
import Onboarding from './onboarding'
import Welcome from './welcome'

export const Client = ({
  ostData,
  params
}: {
  ostData: OutstaticData
  params: { ost: string[] }
}) => {
  useInitialData(ostData)
  const { repoSlug, repoOwner, repoBranch, isPending } = useOutstaticNew()
  const [openSidebar, setOpenSidebar] = useState(false)
  const toggleSidebar = () => {
    setOpenSidebar(!openSidebar)
  }

  return (
    <div id="outstatic">
      <AdminHeader toggleSidebar={toggleSidebar} />
      <div className="flex md:grow flex-col-reverse justify-between md:flex-row md:min-h-[calc(100vh-56px)]">
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
      <Toaster richColors />
      <QueryClientProvider client={queryClient}>
        <Client {...props} />
      </QueryClientProvider>
    </OutstaticProvider>
  )
}
