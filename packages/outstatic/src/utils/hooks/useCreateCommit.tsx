import request from 'graphql-request'
import useOutstatic from './useOutstatic'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CREATE_COMMIT } from '@/graphql/mutations/create-commit'
import { CreateCommitOnBranchInput } from '@/graphql/gql/graphql'

export const useCreateCommit = () => {
  const queryClient = useQueryClient()
  const { session } = useOutstatic()

  const mutation = useMutation({
    mutationFn: async (input: CreateCommitOnBranchInput) =>
      request(
        'https://api.github.com/graphql',
        CREATE_COMMIT,
        { input },
        {
          authorization: `Bearer ${session?.access_token}`
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries()
    }
  })

  return mutation
}
