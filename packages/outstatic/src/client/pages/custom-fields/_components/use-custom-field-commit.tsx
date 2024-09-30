import useOutstatic from '@/utils/hooks/useOutstatic'
import { useQueryClient } from '@tanstack/react-query'
import { useCreateCommit } from '@/utils/hooks/useCreateCommit'
import useOid from '@/utils/hooks/useOid'
import { createCommitApi } from '@/utils/createCommitApi'
import { toast } from 'sonner'
import { CustomFieldsType } from '@/types'

export const useCustomFieldCommit = () => {
  const { session, repoSlug, repoBranch, repoOwner, ostContent } =
    useOutstatic()
  const queryClient = useQueryClient()
  const createCommit = useCreateCommit()
  const fetchOid = useOid()

  return async ({
    customFields,
    deleteField = false,
    collection,
    schema,
    fieldName,
    selectedField,
    setCustomFields
  }: {
    customFields: any
    deleteField?: boolean
    collection: string
    schema: any
    fieldName: string
    selectedField: string
    setCustomFields: (fields: CustomFieldsType) => void
  }) => {
    try {
      const oid = await fetchOid()
      const customFieldsJSON = JSON.stringify(
        {
          title: collection,
          type: 'object',
          path: schema?.path,
          properties: { ...customFields }
        },
        null,
        2
      )

      const capi = createCommitApi({
        message: `feat(${collection}): ${
          deleteField ? 'delete' : 'add'
        } ${fieldName} field`,
        owner: repoOwner || session?.user?.login || '',
        oid: oid ?? '',
        name: repoSlug,
        branch: repoBranch
      })

      capi.replaceFile(
        `${ostContent}/${collection}/schema.json`,
        customFieldsJSON + '\n'
      )

      const input = capi.createInput()

      toast.promise(createCommit.mutateAsync(input), {
        loading: `${
          deleteField ? 'Deleting' : selectedField ? 'Editing' : 'Adding'
        } field...`,
        success: `Field ${
          deleteField ? 'deleted' : selectedField ? 'edited' : 'added'
        } successfully`,
        error: `Failed to ${
          deleteField ? 'delete' : selectedField ? 'edit' : 'add'
        } field`
      })

      if (createCommit.isError) {
        throw new Error(
          `Failed to ${
            deleteField ? 'delete' : selectedField ? 'edit' : 'add'
          } field`
        )
      }

      const filePath = `${repoBranch}:${ostContent}/${collection}/schema.json`
      await queryClient.invalidateQueries({
        queryKey: ['collection-schema', { filePath }]
      })

      console.log({ customFields })

      setCustomFields(customFields)

      return true
    } catch (error) {
      console.error('Error in useCustomFieldCommit:', error)
      return false
    }
  }
}
