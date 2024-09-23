import { useEffect } from 'react'
import useOutstatic, { useLocalData } from './useOutstatic'
import { useGetRepository } from './useGetRepository'
import { Router } from '@/client/router'

export const useDashboardLogic = (params: { ost: string[] }) => {
  const { repoSlug, repoOwner, repoBranch, isPending } = useOutstatic()
  const { data: repository, isPending: repoPending } = useGetRepository()
  const { setData, data, isPending: localPending } = useLocalData()

  useEffect(() => {
    if (repository && !repoBranch && !data.repoBranch) {
      const defaultBranch = repository.defaultBranchRef?.name
      if (defaultBranch) {
        setData({ repoBranch: defaultBranch })
      }
    }
  }, [repository, setData, data, repoBranch])

  const isLoading = isPending || repoPending || localPending
  const showOnboarding = !isLoading && (!repoSlug || !repoOwner)
  const dashboardContent = <Router params={params} />

  return { isLoading, showOnboarding, dashboardContent }
}
