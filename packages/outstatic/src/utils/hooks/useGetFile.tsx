import { GET_FILE } from '@/graphql/queries/file'
import { useQuery } from '@tanstack/react-query'
import { useOutstaticNew } from './useOstData'

export const useGetFile = ({
  filePath,
  enabled = false
}: {
  filePath: string
  enabled?: boolean
}) => {
  const { repoOwner, repoSlug, session, gqlClient } = useOutstaticNew()

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
