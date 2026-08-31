import { OUTSTATIC_API_PATH, OUTSTATIC_VERSION } from '@/utils/constants'
import { useQuery } from '@tanstack/react-query'

const VERSION_CHECK_CACHE_TIME = 1000 * 60 * 60 * 24

export type OutstaticVersionCheck = {
  currentVersion: string
  latestVersion: string
  updateAvailable: boolean
}

function isVersionCheck(value: unknown): value is OutstaticVersionCheck {
  return (
    typeof value === 'object' &&
    value !== null &&
    'currentVersion' in value &&
    typeof value.currentVersion === 'string' &&
    'latestVersion' in value &&
    typeof value.latestVersion === 'string' &&
    'updateAvailable' in value &&
    typeof value.updateAvailable === 'boolean'
  )
}

export function useOutstaticVersion({
  basePath = '',
  enabled = true
}: { basePath?: string; enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['outstatic-version', OUTSTATIC_VERSION, basePath],
    queryFn: async (): Promise<OutstaticVersionCheck> => {
      const normalizedBasePath = basePath.replace(/\/+$/, '')
      const apiPath = OUTSTATIC_API_PATH.replace(/\/+$/, '')
      const params = new URLSearchParams({ version: OUTSTATIC_VERSION })
      const response = await fetch(
        `${normalizedBasePath}${apiPath}/version?${params.toString()}`,
        { headers: { Accept: 'application/json' } }
      )

      if (!response.ok) {
        throw new Error('Unable to check the latest Outstatic version.')
      }

      const data: unknown = await response.json()

      if (!isVersionCheck(data)) {
        throw new Error('The Outstatic version response is invalid.')
      }

      return data
    },
    enabled,
    gcTime: VERSION_CHECK_CACHE_TIME,
    staleTime: VERSION_CHECK_CACHE_TIME,
    retry: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    meta: { persist: true, suppressErrorToast: true }
  })
}
