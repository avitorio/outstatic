import { useOutstatic } from '@/utils/hooks/useOutstatic'
import { useCreateCommit } from '@/utils/hooks/useCreateCommit'
import useOid from '@/utils/hooks/useOid'
import { createCommitApi } from '@/utils/createCommitApi'
import { toast } from 'sonner'
import { useGetSingletonSchema } from '@/utils/hooks/useGetSingletonSchema'

export const useSingletonFieldCommit = (slug: string) => {
  const { session, repoSlug, repoBranch, repoOwner, ostContent } =
    useOutstatic()
  const createCommit = useCreateCommit()
  const fetchOid = useOid()
  const { refetch: refetchSchema } = useGetSingletonSchema({
    slug,
    enabled: false
  })

  return async ({
    customFields,
    deleteField = false,
    fieldName,
    selectedField,
    title
  }: {
    customFields: any
    deleteField?: boolean
    fieldName: string
    selectedField: string
    title: string
  }) => {
    try {
      const oid = await fetchOid()
      const customFieldsJSON = JSON.stringify(
        {
          title,
          type: 'object',
          properties: { ...customFields }
        },
        null,
        2
      )

      const capi = createCommitApi({
        message: `feat(singleton/${slug}): ${
          deleteField ? 'delete' : 'add'
        } ${fieldName} field`,
        owner: repoOwner || session?.user?.login || '',
        oid: oid ?? '',
        name: repoSlug,
        branch: repoBranch
      })

      capi.replaceFile(
        `${ostContent}/_singletons/${slug}.schema.json`,
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
      console.error('Error in useSingletonFieldCommit:', error)
      return false
    }
  }
}
