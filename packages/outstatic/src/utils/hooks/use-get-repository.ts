import { useQuery } from '@tanstack/react-query'
import { useOutstatic } from './use-outstatic'
import { GET_REPOSITORY } from '@/graphql/queries/repository'

export const useGetRepository = (options?: { enabled?: boolean }) => {
  const { repoOwner, repoSlug, gqlClient } = useOutstatic()

  return useQuery({
    queryKey: ['repository', repoOwner, repoSlug],
    queryFn: async () => {
      if (!repoOwner || !repoSlug) return null

      const { repository } = await gqlClient.request(GET_REPOSITORY, {
        owner: repoOwner,
        name: repoSlug
      })

      if (!repository || !repository.defaultBranchRef?.target) {
        throw new Error('Repository or default branch information not found')
      }

      return repository
    },
    meta: {
      errorMessage: 'Failed to fetch repository information'
    },
    enabled: options?.enabled !== false && !!repoOwner && !!repoSlug,
    staleTime: 1000 * 60 * 60 // 1 hour
  })
}
