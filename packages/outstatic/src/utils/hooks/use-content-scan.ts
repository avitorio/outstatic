import type { ContentScanResult } from '@/types/content-scan'
import { useOutstatic } from '@/utils/hooks/use-outstatic'
import { usePermissions } from '@/utils/hooks/use-permissions'
import { useQuery } from '@tanstack/react-query'

export function useContentScan() {
  const { contentScanUrl, projectInfo, repoBranch } = useOutstatic()
  const { canManageCollections } = usePermissions()
  const projectId = projectInfo?.projectId

  return useQuery({
    queryKey: ['content-scan-v4', { projectId, repoBranch }],
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
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.message || 'Repository scan failed.')
      return data as ContentScanResult
    },
    enabled: Boolean(contentScanUrl && projectId && repoBranch && canManageCollections),
    staleTime: 1000 * 60 * 60
  })
}
