import request from 'graphql-request'
import { useQuery } from '@tanstack/react-query'
import { useOutstaticNew } from './useOstData'
import { useParams } from 'next/navigation'
import { GET_FILE } from '@/graphql/queries/file'

export type SchemaType = {
  title: string
  type: string
  properties: Record<string, unknown>
  path: string
} | null

export const useGetCollectionSchema = ({
  collection,
  enabled = true
}: {
  collection?: string
  enabled?: boolean
} = {}) => {
  const { repoOwner, repoSlug, repoBranch, ostContent, session } =
    useOutstaticNew()

  const params = useParams<{ ost: string[] }>()
  const collectionSlug = collection || params?.ost[0]

  const filePath = `${repoBranch}:${ostContent}/${collectionSlug}/schema.json`

  return useQuery({
    queryKey: ['collection-schema', { filePath }],
    queryFn: async (): Promise<SchemaType> => {
      try {
        const { repository } = await request(
          'https://api.github.com/graphql',
          GET_FILE,
          {
            owner: repoOwner || session?.user?.login || '',
            name: repoSlug,
            filePath
          },
          {
            authorization: `Bearer ${session?.access_token}`
          }
        )

        if (repository?.object === null) return null

        const { text } = repository?.object as { text: string }

        return JSON.parse(text)
      } catch (error) {
        throw new Error()
      }
    },
    meta: {
      errorMessage: `Failed to fetch schema for: ${collectionSlug}`
    },
    enabled
  })
}
