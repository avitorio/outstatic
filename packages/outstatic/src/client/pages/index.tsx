'use client'
import { OutstaticData } from '@/app'
import { AdminHeader } from '@/components/admin-header'
import { Sidebar } from '@/components/sidebar'
import { AdminLoading } from '@/components/admin-loading'
import { useOutstatic, useLocalData } from '@/utils/hooks/use-outstatic'
import { useEffect } from 'react'
import { Router } from '../router'
import Login from './login'
import Welcome from './welcome'
import { useGetRepository } from '@/utils/hooks/use-get-repository'
import Onboarding from './onboarding'
import { SidebarProvider } from '@/components/ui/shadcn/sidebar'
import { RootProvider } from './_components/root-provider'
import RedirectingPage from './redirect'

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
                <Main params={params} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  )
}

export const Main = ({ params }: { params: { ost: string[] } }) => {
  const { repoSlug, repoOwner, repoBranch, isPending, session } = useOutstatic()
  const { data: repository } = useGetRepository()
  const { setData, data, isPending: localPending } = useLocalData()
  const localRepoBranch = data.repoBranch
  const sessionLogin = session?.user.login

  useEffect(() => {
    if (repository && !repoBranch && !localRepoBranch) {
      const defaultBranch = repository.defaultBranchRef?.name
      if (defaultBranch) {
        setData({ repoBranch: defaultBranch })
      }
    }

    if (repoSlug && !repoOwner && sessionLogin) {
      setData({ repoBranch, repoOwner: sessionLogin })
    }
  }, [
    repository,
    repoBranch,
    localRepoBranch,
    repoSlug,
    repoOwner,
    sessionLogin,
    setData
  ])

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

  if (params?.ost?.includes('redirect')) {
    return <RedirectingPage />
  }

  if (!ostData?.session) {
    return <Login basePath={ostData?.basePath} isPro={ostData?.isPro} />
  }

  return (
    <RootProvider ostData={ostData}>
      <AdminArea params={params} />
    </RootProvider>
  )
}
