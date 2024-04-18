import request from 'graphql-request'
import { useQuery } from '@tanstack/react-query'
import { useOutstaticNew } from './useOstData'
import { GET_FILE } from '@/graphql/queries/file'

export const useGetFile = ({
  filePath,
  enabled = false
}: {
  filePath: string
  enabled?: boolean
}) => {
  const { repoOwner, repoSlug, session } = useOutstaticNew()

  return useQuery({
    queryKey: ['document', { filePath }],
    queryFn: async () =>
      request(
        'https://api.github.com/graphql',
        GET_FILE,
        {
          owner: repoOwner || session?.user?.login || '',
          name: repoSlug,
          filePath
        },
        {
          authorization: `Bearer ${session?.access_token}`
        }
      ),
    enabled
  })
}
