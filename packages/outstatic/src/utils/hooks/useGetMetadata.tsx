import request from 'graphql-request'
import { useQuery } from '@tanstack/react-query'
import { useOutstaticNew } from './useOstData'
import { GET_FILE } from '@/graphql/queries/file'
import { MetadataSchema } from '../metadata/types'

export const useGetMetadata = ({
  enabled = true
}: {
  enabled?: boolean
} = {}) => {
  const { repoOwner, repoSlug, repoBranch, ostContent, session } =
    useOutstaticNew()

  const filePath = `${repoBranch}:${ostContent}/metadata.json`

  return useQuery({
    queryKey: ['metadata', { filePath }],
    queryFn: async () => {
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

      if (repository?.object === null) throw new Error('No metadata found')

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
