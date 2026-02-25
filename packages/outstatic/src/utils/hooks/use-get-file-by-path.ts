import { GET_FILE } from '@/graphql/queries/file'
import { MDExtensions } from '@/types'
import { useOutstatic } from '@/utils/hooks/use-outstatic'
import { useQuery } from '@tanstack/react-query'

type FileData = {
  content: string
  extension: MDExtensions
} | null

export const useGetFileByPath = ({
  filePath,
  enabled = false
}: {
  filePath: string | null
  enabled?: boolean
}) => {
  const { repoOwner, repoSlug, repoBranch, session, gqlClient } = useOutstatic()

  return useQuery({
    queryKey: ['file-by-path', { filePath }],
    queryFn: async (): Promise<FileData> => {
      if (!filePath) throw new Error('File path is required')

      const extension: MDExtensions = filePath.endsWith('.mdx') ? 'mdx' : 'md'

      const response = await gqlClient.request(GET_FILE, {
        owner: repoOwner || session?.user?.login || '',
        name: repoSlug,
        filePath: `${repoBranch}:${filePath}`
      })

      const fileObject = response?.repository?.object as {
        text?: string
      } | null

      if (!fileObject?.text) {
        return null
      }

      return { content: fileObject.text, extension }
    },
    meta: {
      errorMessage: `Failed to fetch file: ${filePath}`
    },
    enabled: enabled && !!filePath
  })
}
