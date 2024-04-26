import { GET_DOCUMENT } from '@/graphql/queries/document'
import { MDExtensions } from '@/types'
import useOutstatic from '@/utils/hooks/useOutstatic'
import { useQuery } from '@tanstack/react-query'
type Repository = {
  fileMD: { text: string } | null
  fileMDX: { text: string } | null
}

export type GetDocumentData = {
  repository: Repository
}

type DocumentData = {
  mdDocument: string
  extension: MDExtensions
} | null

export const useGetDocument = ({
  filePath,
  enabled = false
}: {
  filePath: string
  enabled?: boolean
}) => {
  const { repoOwner, repoSlug, repoBranch, session, gqlClient } = useOutstatic()

  return useQuery({
    queryKey: ['document', { filePath }],
    queryFn: async (): Promise<DocumentData> => {
      const { repository } = await gqlClient.request<GetDocumentData>(
        GET_DOCUMENT,
        {
          owner: repoOwner || session?.user?.login || '',
          name: repoSlug,
          mdPath: `${repoBranch}:${filePath}.md`,
          mdxPath: `${repoBranch}:${filePath}.mdx`
        }
      )

      if (!repository) throw new Error('No document found')

      const { fileMD, fileMDX } = repository

      if (fileMD !== null) {
        return { mdDocument: fileMD.text, extension: 'md' }
      } else if (fileMDX !== null) {
        return { mdDocument: fileMDX.text, extension: 'mdx' }
      } else {
        return null // or handle the case where both are null
      }
    },
    meta: {
      errorMessage: `Failed to fetch document for: ${filePath}`
    },
    enabled
  })
}
