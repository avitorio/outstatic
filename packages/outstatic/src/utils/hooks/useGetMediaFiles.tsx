import { GET_FILE } from '@/graphql/queries/file'
import useOutstatic from '@/utils/hooks/useOutstatic'
import { useQuery } from '@tanstack/react-query'
import { MediaSchema } from '../metadata/types'
import { MEDIA_JSON_PATH } from '../constants'

export type GetMediaType = {
  media: MediaSchema
  commitUrl: string
} | null

export const useGetMediaFiles = ({
  enabled = true
}: {
  enabled?: boolean
} = {}) => {
  const { repoOwner, repoSlug, repoBranch, session, gqlClient } = useOutstatic()

  const filePath = `${repoBranch}:${MEDIA_JSON_PATH}`

  return useQuery({
    queryKey: ['media', { filePath }],
    queryFn: async (): Promise<GetMediaType> => {
      const { repository } = await gqlClient.request(GET_FILE, {
        owner: repoOwner || session?.user?.login || '',
        name: repoSlug,
        filePath
      })

      if (!repository?.object) return null

      const { text, commitUrl } = repository.object as {
        text: string
        commitUrl: string
      }

      const media = JSON.parse(text) as MediaSchema

      return { media, commitUrl }
    },
    meta: {
      errorMessage: `Failed to fetch media.`
    },
    enabled
  })
}
