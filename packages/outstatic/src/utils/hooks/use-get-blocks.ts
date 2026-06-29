import { GET_FILE } from '@/graphql/queries/file'
import { useOutstatic } from '@/utils/hooks/use-outstatic'
import { useQuery } from '@tanstack/react-query'
import { BlocksSchema } from '../metadata/types'

export type GetBlocksType = {
  blocks: BlocksSchema
  commitUrl: string
} | null

export const useGetBlocks = ({
  enabled = true
}: {
  enabled?: boolean
} = {}) => {
  const {
    repoOwner,
    repoSlug,
    repoBranch,
    session,
    gqlClient,
    blocksJsonPath
  } = useOutstatic()

  const filePath = `${repoBranch}:${blocksJsonPath}`

  return useQuery({
    queryKey: ['blocks', { filePath }],
    queryFn: async (): Promise<GetBlocksType> => {
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

      const blocks = JSON.parse(text) as BlocksSchema

      return { blocks, commitUrl }
    },
    meta: {
      errorMessage: `Failed to fetch blocks.`
    },
    enabled
  })
}
