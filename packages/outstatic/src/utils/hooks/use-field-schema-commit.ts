import { CustomFieldsType } from '@/types'
import { createCommitApi } from '@/utils/create-commit-api'
import { useCreateCommit } from '@/utils/hooks/use-create-commit'
import useOid from '@/utils/hooks/use-oid'
import { useOutstatic } from '@/utils/hooks/use-outstatic'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  createFieldSchemaDocument,
  FieldSchemaCommitAction,
  FieldSchemaTarget,
  getFieldSchemaCommitMessage,
  getFieldSchemaFilePath,
  getFieldSchemaQueryKey
} from './field-schema'

const actionLabels = {
  add: 'Adding',
  edit: 'Editing',
  delete: 'Deleting'
} as const

const actionPastTense = {
  add: 'added',
  edit: 'edited',
  delete: 'deleted'
} as const

export const useFieldSchemaCommit = (target: FieldSchemaTarget) => {
  const { session, repoSlug, repoBranch, repoOwner, ostContent } =
    useOutstatic()
  const createCommit = useCreateCommit()
  const fetchOid = useOid()
  const queryClient = useQueryClient()

  return async ({
    customFields,
    action,
    fieldName
  }: {
    customFields: CustomFieldsType
    action: FieldSchemaCommitAction
    fieldName: string
  }) => {
    try {
      const oid = await fetchOid()

      const capi = createCommitApi({
        message: getFieldSchemaCommitMessage(target, action, fieldName),
        owner: repoOwner || session?.user?.login || '',
        oid: oid ?? '',
        name: repoSlug,
        branch: repoBranch
      })

      capi.replaceFile(
        getFieldSchemaFilePath(target, ostContent),
        createFieldSchemaDocument(target, customFields)
      )

      const input = capi.createInput()

      const commitPromise = createCommit
        .mutateAsync(input)
        .then(async (data) => {
          await queryClient.invalidateQueries({
            queryKey: getFieldSchemaQueryKey(target, ostContent, repoBranch)
          })

          return data
        })

      await toast.promise(commitPromise, {
        loading: `${actionLabels[action]} field...`,
        success: `Field ${actionPastTense[action]} successfully`,
        error: `Failed to ${action} field`
      })

      return true
    } catch (error) {
      console.error('Error in useFieldSchemaCommit:', error)
      return false
    }
  }
}
