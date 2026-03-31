import { GET_FILE } from '@/graphql/queries/file'
import { useOutstatic } from '@/utils/hooks/use-outstatic'
import { useQuery } from '@tanstack/react-query'

export const useGetFile = ({
  filePath,
  enabled = false
}: {
  filePath: string
  enabled?: boolean
}) => {
  const { repoOwner, repoSlug, session, gqlClient } = useOutstatic()

  return useQuery({
    queryKey: ['document', { filePath }],
    queryFn: async () =>
      gqlClient.request(GET_FILE, {
        owner: repoOwner || session?.user?.login || '',
        name: repoSlug,
        filePath
      }),
    enabled
  })
}
