'use client'
import { OutstaticData } from '@/app'
import { AdminHeader } from '@/components/admin-header'
import { Sidebar } from '@/components/sidebar'
import { AdminLoading } from '@/components/admin-loading'
import { InitialDataContext } from '@/utils/hooks/useInitialData'
import { useOutstatic, useLocalData } from '@/utils/hooks/useOutstatic'
import { queryClient } from '@/utils/react-query/queryClient'
import { QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Toaster } from 'sonner'
import { Router } from '../router'
import Login from './login'
import Welcome from './welcome'
import { useGetRepository } from '@/utils/hooks/useGetRepository'
import Onboarding from './onboarding'
import { NavigationGuardProvider } from 'next-navigation-guard'
import { V2BreakingCheck } from '@/components/v2-breaking-check'
import { ThemeProvider } from 'next-themes'
import 'katex/dist/katex.min.css'
import { SidebarProvider } from '@/components/ui/shadcn/sidebar'

type OstClientProps = {
  ostData: OutstaticData
  params: { ost: string[] }
}

export const AdminArea = ({ params }: { params: { ost: string[] } }) => {
  return (
    <SidebarProvider>
      <div className="flex h-screen flex-1 flex-col w-full">
        <div className="flex flex-1 flex-col">
          <div className="dark:border-border dark:bg-background dark:shadow-primary/10 bg-background z-50 flex h-14 items-center justify-between border-b border-gray-200 px-4 lg:justify-start">
            <div className="flex w-full flex-1 items-center space-x-8">
              <div className="flex flex-1">
                <AdminHeader />
              </div>
            </div>
          </div>
          <div className="dark:bg-background flex max-h-[calc(100svh-3.5rem)] overflow-hidden bg-gray-50">
            <div className="flex flex-1">
              <Sidebar />
            </div>

            <div className="dark:bg-background bg-background mx-auto flex w-full flex-col overflow-y-auto">
              <div className={'flex flex-1 overflow-y-auto'}>
                <Dashboard params={params} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
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
    return <Login basePath={ostData?.basePath} isPro={ostData?.isPro} />
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
        <V2BreakingCheck />
      </ThemeProvider>
    </InitialDataContext.Provider>
  )
}
