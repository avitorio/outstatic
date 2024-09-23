import { useQuery } from '@tanstack/react-query'
import { useOutstatic } from './useOutstatic'
import { GET_REPOSITORY } from '@/graphql/queries/repository'

export const useGetRepository = (options?: { enabled?: boolean }) => {
  const { repoOwner, repoSlug, gqlClient } = useOutstatic()

  return useQuery({
    queryKey: ['repository', repoOwner, repoSlug],
    queryFn: async () => {
      try {
        const { repository } = await gqlClient.request(GET_REPOSITORY, {
          owner: repoOwner,
          name: repoSlug
        })

        if (!repository || !repository.defaultBranchRef?.target) {
          throw new Error('Repository or default branch information not found')
        }

        return repository
      } catch (error) {
        console.error('Error fetching repository:', error)
        throw error
      }
    },
    enabled: options?.enabled !== false && !!repoOwner && !!repoSlug,
    staleTime: 1000 * 60 * 60
  })
}
