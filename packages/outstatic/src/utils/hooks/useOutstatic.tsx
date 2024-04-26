import { OutstaticData } from '@/app'
import { useContentLock } from '@/utils/hooks/useContentLock'
import { useInitialData } from '@/utils/hooks/useInitialData'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { GraphQLClient } from 'graphql-request'

const useOutstatic = () => {
  const { hasChanges, setHasChanges } = useContentLock()
  const initialData = useInitialData()
  const { data: localData, isPending: localPending } = useLocalData()
  const graphQLClient = new GraphQLClient('https://api.github.com/graphql', {
    headers: {
      authorization: `Bearer ${initialData?.session?.access_token}`
    }
  })

  const cleanInitialData = { ...initialData }
  for (let key in cleanInitialData) {
    if (
      cleanInitialData[key as keyof OutstaticData] === '' ||
      cleanInitialData[key as keyof OutstaticData] === null ||
      cleanInitialData[key as keyof OutstaticData] === undefined
    ) {
      delete cleanInitialData[key as keyof OutstaticData]
    }
  }

  // Merge local data with initial data, giving preference to
  // initialData (.ENV variables) over localData (local storage)
  const outstaticData = {
    ...localData,
    ...cleanInitialData,
    isPending: localPending
  } as OutstaticData & {
    isPending: boolean
    gqlClient: GraphQLClient
  }

  const { monorepoPath, contentPath } = outstaticData

  return {
    ...outstaticData,
    gqlClient: graphQLClient,
    ostContent: [monorepoPath, contentPath].filter(Boolean).join('/'),
    hasChanges,
    setHasChanges
  }
}

export default useOutstatic

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
        pages: ['collections', 'settings'],
        contentPath: 'outstatic/content',
        monorepoPath: '',
        repoSlug: '',
        repoBranch: '',
        repoOwner: '',
        basePath: '',
        ostDetach: false
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
