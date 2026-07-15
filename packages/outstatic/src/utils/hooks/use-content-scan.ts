import type { ContentScanResult } from '@/types/content-scan'
import { useOutstatic } from '@/utils/hooks/use-outstatic'
import { usePermissions } from '@/utils/hooks/use-permissions'
import { useQuery } from '@tanstack/react-query'

export function useContentScan() {
  const { contentScanUrl, projectInfo, repoBranch } = useOutstatic()
  const { canManageCollections } = usePermissions()
  const projectId = projectInfo?.projectId

  return useQuery({
    queryKey: ['content-scan-v6', { projectId, repoBranch }],
    queryFn: async (): Promise<ContentScanResult> => {
      if (!contentScanUrl || !projectId || !repoBranch) {
        throw new Error('Repository discovery is not available.')
      }
      const response = await fetch(contentScanUrl, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, branch: repoBranch })
      })
      const body = await response.text()
      let data: unknown = null
      try {
        data = body ? JSON.parse(body) : null
      } catch {
        // The self-hosted proxy can return plain-text 401/404 responses.
      }
      if (!response.ok) {
        const message =
          typeof data === 'object' &&
          data !== null &&
          'message' in data &&
          typeof data.message === 'string'
            ? data.message
            : body || 'Repository scan failed.'
        throw new Error(message)
      }
      if (!data || typeof data !== 'object') {
        throw new Error('Repository scan returned an invalid response.')
      }
      return data as ContentScanResult
    },
    enabled: Boolean(
      contentScanUrl && projectId && repoBranch && canManageCollections
    ),
    staleTime: 1000 * 60 * 60
  })
}
