import { OutstaticData } from '@/app'
import { useContentLock } from '@/utils/hooks/useContentLock'
import { useInitialData } from '@/utils/hooks/useInitialData'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { GraphQLClient } from 'graphql-request'
import { useCreateGraphQLClient } from '@/graphql/utils/useCreateGraphQLClient'
import { CONFIG_JSON_PATH } from '../constants'
import { GET_FILE } from '@/graphql/queries/file'
import { ConfigType } from '../metadata/types'
import { Session } from '@/types'
import { ConfigSchema } from '../schemas/config-schema'

type HeadersType = {
  authorization: string
  'X-CSRF-Token'?: string
}

const cleanOutstaticData = (
  data: Partial<OutstaticData>
): Partial<OutstaticData> => {
  const cleanedData = { ...data }
  for (let key in cleanedData) {
    if (
      cleanedData[key as keyof OutstaticData] === '' ||
      cleanedData[key as keyof OutstaticData] === null ||
      cleanedData[key as keyof OutstaticData] === undefined
    ) {
      delete cleanedData[key as keyof OutstaticData]
    }
  }
  return cleanedData
}

export const useOutstatic = () => {
  const { hasChanges, setHasChanges } = useContentLock()
  const initialData = useInitialData()
  const { data: localData, isPending: localPending } = useLocalData()

  const headers: HeadersType = {
    authorization: `Bearer ${initialData?.session?.access_token}`
  }

  const graphQLClient = useCreateGraphQLClient(initialData.githubGql, headers)

  const cleanInitialData = cleanOutstaticData(initialData)

  const { data: config } = useGetInitialConfig({
    repoOwner: cleanInitialData.repoOwner || localData.repoOwner || '',
    repoSlug: cleanInitialData.repoSlug || localData.repoSlug || '',
    repoBranch: cleanInitialData.repoBranch || localData.repoBranch || '',
    session: cleanInitialData?.session || null,
    gqlClient: graphQLClient
  })

  const cleanConfig = cleanOutstaticData(config || {})

  // Merge local data with initial data, giving preference to
  // initialData (.ENV variables) over localData (local storage)
  const outstaticData = {
    ...localData,
    ...cleanConfig,
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

const useGetInitialConfig = ({
  repoOwner,
  repoSlug,
  repoBranch,
  session,
  gqlClient
}: {
  repoOwner: string
  repoSlug: string
  repoBranch: string
  session: Session | null
  gqlClient: GraphQLClient
}) => {
  const filePath = `${repoBranch}:${CONFIG_JSON_PATH}`

  return useQuery({
    queryKey: ['config', { filePath }],
    queryFn: async (): Promise<ConfigType | null> => {
      const owner = repoOwner || session?.user?.login
      if (!owner) {
        throw new Error('Repository owner is not defined')
      }
      const { repository } = await gqlClient.request(GET_FILE, {
        owner: repoOwner || session?.user?.login || '',
        name: repoSlug,
        filePath
      })

      if (!repository?.object) return null

      const { text } = repository.object as {
        text: string
      }

      try {
        const config = ConfigSchema.parse(JSON.parse(text))
        return config
      } catch (error) {
        console.error('Failed to parse config:', error)
        return null
      }
    },
    meta: {
      errorMessage: `Failed to fetch config.`
    },
    enabled: !!(repoOwner && repoSlug && repoBranch)
  })
}
