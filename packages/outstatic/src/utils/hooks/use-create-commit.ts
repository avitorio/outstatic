import { CreateCommitOnBranchInput } from '@/graphql/gql/graphql'
import { CREATE_COMMIT } from '@/graphql/mutations/create-commit'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useOutstatic } from './use-outstatic'
import {
  DemoWriteBlockedError,
  useDemoWriteGuard
} from './use-demo-write-guard'

export const useCreateCommit = () => {
  const queryClient = useQueryClient()
  const { gqlClient } = useOutstatic()
  const blockDemoWrite = useDemoWriteGuard()

  const mutation = useMutation({
    mutationFn: async (input: CreateCommitOnBranchInput) => {
      if (blockDemoWrite()) {
        throw new DemoWriteBlockedError()
      }

      return gqlClient.request(CREATE_COMMIT, { input })
    },
    onSuccess: () => {
      queryClient.invalidateQueries()
    }
  })

  return mutation
}
