import { useMutation } from '@tanstack/react-query'
import { useOutstatic } from './useOutstatic'
import { GET_REPOSITORY } from '../../graphql/queries/repository'
import { CREATE_BRANCH } from '../../graphql/mutations/create-branch'

export const useCreateBranch = () => {
  const { repoOwner, repoSlug, gqlClient } = useOutstatic()

  return useMutation({
    mutationFn: async ({ branchName }: { branchName: string }) => {
      try {
        // Get repository info
        const { repository } = await gqlClient.request(GET_REPOSITORY, {
          owner: repoOwner,
          name: repoSlug
        })

        if (!repository || !repository.defaultBranchRef?.target) {
          throw new Error('Repository or default branch information not found')
        }

        const {
          id: repositoryId,
          defaultBranchRef: {
            target: { oid }
          }
        } = repository

        // Create the new branch
        const result = await gqlClient.request(CREATE_BRANCH, {
          repositoryId,
          name: `refs/heads/${branchName}`,
          oid
        })

        if (!result.createRef?.ref?.name) {
          throw new Error('Failed to create branch or branch reference')
        }

        return result.createRef.ref.name
      } catch (error) {
        console.error('Error creating branch:', error)
        throw error
      }
    }
  })
}
