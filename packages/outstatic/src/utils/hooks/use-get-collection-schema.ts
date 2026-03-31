import { GET_FILE } from '@/graphql/queries/file'
import { CustomFieldsType } from '@/types'
import { useOutstatic } from '@/utils/hooks/use-outstatic'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'

export type SchemaType = {
  title: string
  type: string
  properties: CustomFieldsType
  path: string
} | null

export const useGetCollectionSchema = ({
  collection,
  enabled = true
}: {
  collection?: string
  enabled?: boolean
} = {}) => {
  const { repoOwner, repoSlug, repoBranch, ostContent, session, gqlClient } =
    useOutstatic()

  const params = useParams<{ ost: string[] }>()
  const collectionSlug = collection || params?.ost[0]

  const filePath = `${repoBranch}:${ostContent}/${collectionSlug}/schema.json`

  return useQuery({
    queryKey: ['collection-schema', { filePath }],
    queryFn: async (): Promise<SchemaType> => {
      const { repository } = await gqlClient.request(GET_FILE, {
        owner: repoOwner || session?.user?.login || '',
        name: repoSlug,
        filePath
      })

      if (repository?.object === null) return null

      const { text } = repository?.object as { text: string }

      return JSON.parse(text)
    },
    meta: {
      errorMessage: `Failed to fetch schema for: ${collectionSlug}`
    },
    enabled
  })
}
