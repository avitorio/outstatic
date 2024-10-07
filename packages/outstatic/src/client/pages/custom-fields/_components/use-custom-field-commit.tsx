import useOutstatic from '@/utils/hooks/useOutstatic'
import { useCreateCommit } from '@/utils/hooks/useCreateCommit'
import useOid from '@/utils/hooks/useOid'
import { createCommitApi } from '@/utils/createCommitApi'
import { toast } from 'sonner'
import { useGetCollectionSchema } from '@/utils/hooks/useGetCollectionSchema'

export const useCustomFieldCommit = () => {
  const { session, repoSlug, repoBranch, repoOwner, ostContent } =
    useOutstatic()
  const createCommit = useCreateCommit()
  const fetchOid = useOid()
  const { refetch: refetchSchema } = useGetCollectionSchema({ enabled: false })

  return async ({
    customFields,
    deleteField = false,
    collection,
    fieldName,
    selectedField
  }: {
    customFields: any
    deleteField?: boolean
    collection: string
    fieldName: string
    selectedField: string
  }) => {
    try {
      const oid = await fetchOid()
      const customFieldsJSON = JSON.stringify(
        {
          title: collection,
          type: 'object',
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
        success: () => {
          refetchSchema()
          return `Field ${
            deleteField ? 'deleted' : selectedField ? 'edited' : 'added'
          } successfully`
        },
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

      return true
    } catch (error) {
      console.error('Error in useCustomFieldCommit:', error)
      return false
    }
  }
}
