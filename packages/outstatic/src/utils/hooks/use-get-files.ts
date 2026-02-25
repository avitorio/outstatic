import { GET_FILES } from '@/graphql/queries/files'
import { useOutstatic } from '@/utils/hooks/use-outstatic'
import { useQuery } from '@tanstack/react-query'

export const useGetFiles = ({
  path = '',
  enabled = true
}: {
  path?: string
  enabled?: boolean
}) => {
  const { repoOwner, repoSlug, repoBranch, session, gqlClient } = useOutstatic()

  return useQuery({
    queryKey: [
      `files_${repoOwner}/${repoSlug}/${repoBranch}/${path}`,
      { path }
    ],
    queryFn: async () => {
      const { repository } = await gqlClient.request(GET_FILES, {
        owner: repoOwner || session?.user?.login || '',
        name: repoSlug,
        contentPath: `${repoBranch}:${path}`
      })

      if (repository?.object === null) throw new Error('Ouch.')

      return { repository }
    },
    enabled,
    meta: {
      errorMessage: `Failed to fetch files for ${path}`
    }
  })
}
