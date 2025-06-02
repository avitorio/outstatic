'use client'
import { OutstaticData } from '@/app'
import { AdminHeader, Sidebar } from '@/components'
import { AdminLoading } from '@/components/AdminLoading'
import { InitialDataContext } from '@/utils/hooks/useInitialData'
import { useOutstatic, useLocalData } from '@/utils/hooks/useOutstatic'
import { queryClient } from '@/utils/react-query/queryClient'
import { QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Toaster } from 'sonner'
import { Router } from '../router'
import Login from './login'
import Welcome from './welcome'
import { useGetRepository } from '@/utils/hooks/useGetRepository'
import Onboarding from './onboarding'
import { NavigationGuardProvider } from 'next-navigation-guard'
import V2_0_BreakingCheck from '@/components/v2_0_BreakingCheck'
import { ThemeProvider } from 'next-themes'

type OstClientProps = {
  ostData: OutstaticData
  params: { ost: string[] }
}

export const AdminArea = ({ params }: { params: { ost: string[] } }) => {
  const [openSidebar, setOpenSidebar] = useState(false)
  const toggleSidebar = () => {
    setOpenSidebar(!openSidebar)
  }

  return (
    <div className="min-h-screen">
      <AdminHeader toggleSidebar={toggleSidebar} />
      <div className="flex md:grow flex-col-reverse justify-between md:flex-row md:min-h-[calc(100vh-56px)]">
        <div className="flex w-full">
          <Sidebar isOpen={openSidebar} />
          <Dashboard params={params} />
        </div>
      </div>
    </div>
  )
}

export const Dashboard = ({ params }: { params: { ost: string[] } }) => {
  const { repoSlug, repoOwner, repoBranch, isPending, session } = useOutstatic()
  const { data: repository } = useGetRepository()
  const { setData, data, isPending: localPending } = useLocalData()

  useEffect(() => {
    if (repository && !repoBranch && !data.repoBranch) {
      const defaultBranch = repository.defaultBranchRef?.name
      if (defaultBranch) {
        setData({ repoBranch: defaultBranch })
      }
    }
    if (repoSlug && !repoOwner) {
      setData({ repoBranch, repoOwner: session?.user.login })
    }
  }, [repository, setData, data, session])

  return (
    <>
      {isPending || localPending ? (
        <AdminLoading />
      ) : !repoSlug || !repoOwner ? (
        <Onboarding />
      ) : (
        <Router params={params} />
      )}
    </>
  )
}

export const OstClient = ({ ostData, params }: OstClientProps) => {
  if (ostData.missingEnvVars) {
    return <Welcome variables={ostData.missingEnvVars} />
  }

  if (!ostData?.session) {
    return <Login basePath={ostData?.basePath} />
  }

  return (
    <InitialDataContext.Provider value={ostData}>
      <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Toaster />
          <QueryClientProvider client={queryClient}>
            <NavigationGuardProvider>
              <AdminArea params={params} />
            </NavigationGuardProvider>
          </QueryClientProvider>
          <V2_0_BreakingCheck />
        </ThemeProvider>
    </InitialDataContext.Provider>
  )
}
