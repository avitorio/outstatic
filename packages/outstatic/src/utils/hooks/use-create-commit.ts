import { CreateCommitOnBranchInput } from '@/graphql/gql/graphql'
import { CREATE_COMMIT } from '@/graphql/mutations/create-commit'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useOutstatic } from './use-outstatic'

export const useCreateCommit = () => {
  const queryClient = useQueryClient()
  const { gqlClient } = useOutstatic()

  const mutation = useMutation({
    mutationFn: async (input: CreateCommitOnBranchInput) =>
      gqlClient.request(CREATE_COMMIT, { input }),
    onSuccess: () => {
      queryClient.invalidateQueries()
    }
  })

  return mutation
}
