import { GET_FILE } from '@/graphql/queries/file'
import { useQuery } from '@tanstack/react-query'
import { MetadataSchema } from '../metadata/types'
import { useOutstaticNew } from './useOstData'

export type GetMetadataType = {
  metadata: MetadataSchema
  commitUrl: string
} | null

export const useGetMetadata = ({
  enabled = true
}: {
  enabled?: boolean
} = {}) => {
  const { repoOwner, repoSlug, repoBranch, ostContent, session, gqlClient } =
    useOutstaticNew()

  const filePath = `${repoBranch}:${ostContent}/metadata.json`

  return useQuery({
    queryKey: ['metadata', { filePath }],
    queryFn: async (): Promise<GetMetadataType> => {
      const { repository } = await gqlClient.request(GET_FILE, {
        owner: repoOwner || session?.user?.login || '',
        name: repoSlug,
        filePath
      })

      if (repository?.object === null) return null

      const { text, commitUrl } = repository?.object as {
        text: string
        commitUrl: string
      }

      const metadata = JSON.parse(text) as MetadataSchema

      return { metadata, commitUrl }
    },
    meta: {
      errorMessage: `Failed to fetch metadata.`
    },
    enabled
  })
}
