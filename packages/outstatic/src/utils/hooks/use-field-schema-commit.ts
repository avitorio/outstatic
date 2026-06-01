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
  FieldSchemaSettings,
  FieldSchemaType,
  FieldSchemaTarget,
  getFieldSchemaCommitMessage,
  getFieldSchemaFilePath,
  getFieldSchemaQueryKey,
  getFieldSchemaRequestPath,
  normalizeFieldSchemaSettings
} from './field-schema'

const actionLabels = {
  add: 'Adding',
  edit: 'Editing',
  delete: 'Deleting',
  reorder: 'Reordering',
  settings: 'Updating'
} as const

const actionPastTense = {
  add: 'added',
  edit: 'edited',
  delete: 'deleted',
  reorder: 'reordered',
  settings: 'updated'
} as const

export const useFieldSchemaCommit = (target: FieldSchemaTarget) => {
  const { session, repoSlug, repoBranch, repoOwner, ostContent } =
    useOutstatic()
  const createCommit = useCreateCommit()
  const fetchOid = useOid()
  const queryClient = useQueryClient()

  return async ({
    customFields,
    settings,
    action,
    fieldName
  }: {
    customFields: CustomFieldsType
    settings?: FieldSchemaSettings
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

      const queryKey = getFieldSchemaQueryKey(target, ostContent, repoBranch)
      const existingSchema = queryClient.getQueryData<FieldSchemaType>(queryKey)
      const schemaSettings = normalizeFieldSchemaSettings(
        settings ?? existingSchema?.settings
      )

      capi.replaceFile(
        getFieldSchemaFilePath(target, ostContent),
        createFieldSchemaDocument(target, customFields, schemaSettings)
      )

      const input = capi.createInput()

      const commitPromise = createCommit
        .mutateAsync(input)
        .then(async (data) => {
          const nextSchema = {
            title:
              existingSchema?.title ??
              (target.kind === 'collection' ? target.slug : target.title),
            type: existingSchema?.type ?? 'object',
            settings: schemaSettings,
            properties: customFields
          }

          queryClient.setQueryData<FieldSchemaType>(queryKey, (current) => ({
            ...nextSchema,
            title: current?.title ?? nextSchema.title,
            type: current?.type ?? nextSchema.type
          }))

          await queryClient.invalidateQueries({
            queryKey
          })
          await queryClient.invalidateQueries({
            queryKey:
              target.kind === 'collection'
                ? [
                    'collection-schema',
                    {
                      filePath: getFieldSchemaRequestPath(
                        target,
                        ostContent,
                        repoBranch
                      )
                    }
                  ]
                : ['singleton-schema', { slug: target.slug }]
          })

          return data
        })

      await toast.promise(commitPromise, {
        loading:
          action === 'settings'
            ? `${actionLabels[action]} settings...`
            : `${actionLabels[action]} field...`,
        success:
          action === 'settings'
            ? `Settings ${actionPastTense[action]} successfully`
            : `Field ${actionPastTense[action]} successfully`,
        error:
          action === 'settings'
            ? 'Failed to update settings'
            : `Failed to ${action} field`
      })

      return true
    } catch (error) {
      console.error('Error in useFieldSchemaCommit:', error)
      return false
    }
  }
}
