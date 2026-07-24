import { CreateCommitOnBranchInput } from '@/graphql/gql/graphql'
import { CREATE_COMMIT } from '@/graphql/mutations/create-commit'
import { useUpgradeDialog } from '@/components/ui/outstatic/upgrade-dialog-context'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useOutstatic } from './use-outstatic'

export const useCreateCommit = () => {
  const queryClient = useQueryClient()
  const { gqlClient, isDemo } = useOutstatic()
  const { openUpgradeDialog } = useUpgradeDialog()

  const mutation = useMutation({
    mutationFn: async (input: CreateCommitOnBranchInput) => {
      if (isDemo) {
        openUpgradeDialog(undefined, undefined, 'demo')
        throw new Error('Demo projects are read-only')
      }

      return gqlClient.request(CREATE_COMMIT, { input })
    },
    onSuccess: () => {
      queryClient.invalidateQueries()
    }
  })

  return mutation
}
