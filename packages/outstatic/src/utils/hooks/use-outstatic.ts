import { OutstaticData } from '@/app'
import { useContentLock } from '@/utils/hooks/use-content-lock'
import { useInitialData } from '@/utils/hooks/use-initial-data'
import { LoginSession } from '@/utils/auth/auth'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { GraphQLClient } from 'graphql-request'
import { useCreateGraphQLClient } from '@/graphql/utils/use-create-graph-ql-client'
import { GET_FILE } from '@/graphql/queries/file'
import { ConfigType } from '../metadata/types'
import { useCallback, useMemo } from 'react'

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
    monorepoPath: cleanInitialData.monorepoPath || localData.monorepoPath || '',
    ostPath: cleanInitialData.ostPath || localData.ostPath || '',
    session: cleanInitialData?.session || null,
    gqlClient: graphQLClient
  })

  const cleanConfig = config
    ? cleanOutstaticData(config)
    : { repoMediaPath: '', publicMediaPath: '' }

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

  const { monorepoPath, contentPath, ostPath } = outstaticData

  return {
    ...outstaticData,
    gqlClient: graphQLClient,
    ostContent: [monorepoPath, contentPath].filter(Boolean).join('/'),
    ostPath: [monorepoPath, ostPath].filter(Boolean).join('/'),
    mediaJsonPath: [monorepoPath, ostPath, 'media/media.json']
      .filter(Boolean)
      .join('/'),
    configJsonPath: [monorepoPath, ostPath, 'config.json']
      .filter(Boolean)
      .join('/'),
    hasChanges,
    setHasChanges
  }
}

export const useLocalData = () => {
  const queryClient = useQueryClient()
  const { repoOwner, repoSlug } = useInitialData()
  const queryKey = useMemo(
    () => ['ost_local_data', { repoOwner, repoSlug }] as const,
    [repoOwner, repoSlug]
  )
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
        pages: ['collections', 'settings', 'singletons'],
        contentPath: 'outstatic/content',
        monorepoPath: '',
        repoSlug: '',
        repoBranch: '',
        repoOwner: '',
        basePath: '',
        repoMediaPath: '',
        publicMediaPath: '',
        ostDetach: false
      }
    },
    meta: { persist: true }
  }) as {
    data: Partial<OutstaticData>
    isLoading: boolean
    isError: boolean
    error: unknown
    isPending: boolean
  }

  const setData = useCallback(
    (newData: Partial<OutstaticData> | ConfigType) => {
      queryClient.setQueryData(queryKey, (oldData: OutstaticData) => ({
        ...oldData,
        ...newData
      }))
      queryClient.invalidateQueries({
        queryKey: ['collections', 'config'],
        refetchType: 'all'
      })
    },
    [queryClient, queryKey]
  )

  return { data, setData, isLoading, isError, error, isPending }
}

const useGetInitialConfig = ({
  repoOwner,
  repoSlug,
  repoBranch,
  session,
  gqlClient,
  monorepoPath,
  ostPath
}: {
  repoOwner: string
  repoSlug: string
  repoBranch: string
  session: LoginSession | null
  gqlClient: GraphQLClient
  monorepoPath: string
  ostPath: string
}) => {
  const filePath = `${repoBranch}:${[monorepoPath, ostPath, 'config.json']
    .filter(Boolean)
    .join('/')}`

  return useQuery({
    queryKey: ['config', { repoOwner, repoSlug, repoBranch, filePath }],
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
        throw error
      }
    },
    staleTime: 1000 * 10,
    enabled: !!(repoOwner && repoSlug && repoBranch)
  })
}
