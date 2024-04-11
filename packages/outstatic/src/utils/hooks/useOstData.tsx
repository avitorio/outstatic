import { OutstaticData } from '@/app'
import { useQuery, useQueryClient } from '@tanstack/react-query'

export const useOutstaticNew = () => {
  const { data: initialData, isPending } = useInitialData()
  const { data: localData, isPending: localPending } = useLocalData()

  for (let key in initialData) {
    if (
      initialData[key] === '' ||
      initialData[key] === null ||
      initialData[key] === undefined
    ) {
      delete initialData[key]
    }
  }

  return {
    ...localData,
    ...initialData,
    isPending: localPending || isPending
  } as OutstaticData & {
    isPending: boolean
  }
}

export const useLocalData = () => {
  const queryClient = useQueryClient()

  const { data, isLoading, isError, error, isPending } = useQuery<
    Partial<OutstaticData>
  >({
    queryKey: ['ost_local_data'],
    queryFn: () => {
      const cachedData = queryClient.getQueryData<OutstaticData>([
        'ost_local_data'
      ])
      if (cachedData) {
        return cachedData
      }

      return {}
    },
    initialData: () => {
      const cachedData = queryClient.getQueryData<OutstaticData>([
        'ost_local_data'
      ])
      if (cachedData) {
        return cachedData
      }

      return {
        pages: [],
        contentPath: 'content',
        monorepoPath: '',
        repoSlug: '',
        repoBranch: 'main',
        repoOwner: '',
        basePath: ''
      }
    },
    meta: { persist: true }
  })

  const setData = (newData: Partial<OutstaticData>) => {
    queryClient.setQueryData(['ost_local_data'], (oldData: OutstaticData) => ({
      ...oldData,
      ...newData
    }))
    queryClient.invalidateQueries({
      queryKey: ['collections'],
      refetchType: 'all'
    })
  }

  return { data, setData, isLoading, isError, error, isPending }
}

export const useInitialData = (initialData?: OutstaticData) => {
  const queryClient = useQueryClient()

  const { data, isLoading, isError, error, isPending } = useQuery<
    Partial<OutstaticData>
  >({
    queryKey: ['ost_initial_data'],
    queryFn: () => {
      const queryClientOstInitialData = queryClient.getQueryData<OutstaticData>(
        ['ost_initial_data']
      )

      if (queryClientOstInitialData) {
        return queryClientOstInitialData
      }

      return {}
    },
    initialData: () => {
      // Check if we have anything in cache and return that, otherwise get initial data
      const cachedData = queryClient.getQueryData<OutstaticData>([
        'ost_initial_data'
      ])

      if (cachedData) {
        queryClient.setQueryData(['ost_initial_data'], () => initialData)
        return cachedData
      }

      return initialData
    }
  })

  return { data, isLoading, isError, error, isPending }
}
