import request from 'graphql-request'
import { useQuery } from '@tanstack/react-query'
import { useOutstaticNew } from './useOstData'
import { GET_DOCUMENT } from '@/graphql/queries/document'

type Repository = {
  fileMD: { text: string } | null
  fileMDX: { text: string } | null
}

export type GetDocumentData = {
  repository: Repository
}

type DocumentData = {
  mdDocument: string
  extension: 'md' | 'mdx'
} | null

export const useGetDocument = ({
  filePath,
  enabled = false
}: {
  filePath: string
  enabled?: boolean
}) => {
  const { repoOwner, repoSlug, repoBranch, session } = useOutstaticNew()

  return useQuery({
    queryKey: ['document', { filePath }],
    queryFn: async (): Promise<DocumentData> => {
      const { repository } = await request<GetDocumentData>(
        'https://api.github.com/graphql',
        GET_DOCUMENT,
        {
          owner: repoOwner || session?.user?.login || '',
          name: repoSlug,
          mdPath: `${repoBranch}:${filePath}.md`,
          mdxPath: `${repoBranch}:${filePath}.mdx`
        },
        {
          authorization: `Bearer ${session?.access_token}`
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
