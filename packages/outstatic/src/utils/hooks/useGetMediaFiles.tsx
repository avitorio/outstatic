import { GET_FILE } from '@/graphql/queries/file'
import useOutstatic from '@/utils/hooks/useOutstatic'
import { useQuery } from '@tanstack/react-query'
import { MediaSchema } from '../metadata/types'

export type GetMediaType = {
  media: MediaSchema
} | null

export const useGetMediaFiles = ({
  enabled = true
}: {
  enabled?: boolean
} = {}) => {
  const { repoOwner, repoSlug, repoBranch, session, gqlClient } = useOutstatic()

  const filePath = `${repoBranch}:outstatic/media/media.json`

  return useQuery({
    queryKey: ['media', { filePath }],
    queryFn: async (): Promise<MediaSchema | null> => {
      const { repository } = await gqlClient.request(GET_FILE, {
        owner: repoOwner || session?.user?.login || '',
        name: repoSlug,
        filePath
      })

      if (repository?.object === null) return null

      const { text } = repository?.object as {
        text: string
      }

      const media = JSON.parse(text) as MediaSchema

      return media
    },
    meta: {
      errorMessage: `Failed to fetch media.`
    },
    enabled
  })
}
