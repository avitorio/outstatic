import { OutstaticData } from '@/app'
import { useContentLock } from '@/utils/hooks/useContentLock'
import { useInitialData } from '@/utils/hooks/useInitialData'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { GraphQLClient } from 'graphql-request'

type HeadersType = {
  authorization: string
  'X-CSRF-Token'?: string
}

export const useOutstatic = () => {
  const { hasChanges, setHasChanges } = useContentLock()
  const initialData = useInitialData()
  const { data: localData, isPending: localPending } = useLocalData()
  const headers: HeadersType = {
    authorization: `Bearer ${initialData?.session?.access_token}`
  }

  if (initialData.csrfToken) {
    headers['X-CSRF-Token'] = initialData.csrfToken
  }

  const graphQLClient = new GraphQLClient(initialData.githubGql, { headers })

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
  const { repoOwner, repoSlug, repoBranch } = useInitialData()
  const queryKey = ['ost_local_data', { repoOwner, repoSlug, repoBranch }]
  const { data, isLoading, isError, error, isPending } = useQuery<
    Partial<OutstaticData>
  >({
    queryKey: queryKey,
    queryFn: () => {
      const cachedData = queryClient.getQueryData<OutstaticData>(queryKey)
      if (cachedData) {
        return cachedData
      }

      return {}
    },
    initialData: () => {
      const cachedData = queryClient.getQueryData<OutstaticData>(queryKey)
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
    queryClient.setQueryData(queryKey, (oldData: OutstaticData) => ({
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
