import { CreateCommitOnBranchInput } from '@/graphql/gql/graphql'
import { CREATE_COMMIT } from '@/graphql/mutations/create-commit'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useOutstaticNew } from './useOstData'

export const useCreateCommit = () => {
  const queryClient = useQueryClient()
  const { gqlClient } = useOutstaticNew()

  const mutation = useMutation({
    mutationFn: async (input: CreateCommitOnBranchInput) =>
      gqlClient.request(CREATE_COMMIT, { input }),
    onSuccess: () => {
      queryClient.invalidateQueries()
    }
  })

  return mutation
}
