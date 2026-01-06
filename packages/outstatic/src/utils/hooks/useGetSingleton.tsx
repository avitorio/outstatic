import { GET_DOCUMENT } from '@/graphql/queries/document'
import { MDExtensions } from '@/types'
import { useOutstatic } from '@/utils/hooks/useOutstatic'
import { useQuery } from '@tanstack/react-query'

type Repository = {
  fileMD: { text: string } | null
  fileMDX: { text: string } | null
}

export type GetSingletonData = {
  repository: Repository
}

type SingletonData = {
  mdDocument: string
  extension: MDExtensions
} | null

export const useGetSingleton = ({
  slug,
  enabled = false
}: {
  slug: string
  enabled?: boolean
}) => {
  const { repoOwner, repoSlug, repoBranch, session, gqlClient, ostContent } =
    useOutstatic()
  const filePath = `${ostContent}/_singletons/${slug}`

  return useQuery({
    queryKey: ['singleton', { slug }],
    queryFn: async (): Promise<SingletonData> => {
      const { repository } = await gqlClient.request<GetSingletonData>(
        GET_DOCUMENT,
        {
          owner: repoOwner || session?.user?.login || '',
          name: repoSlug,
          mdPath: `${repoBranch}:${filePath}.md`,
          mdxPath: `${repoBranch}:${filePath}.mdx`
        }
      )

      if (!repository) throw new Error('No singleton found')

      const { fileMD, fileMDX } = repository

      if (fileMD !== null) {
        return { mdDocument: fileMD.text, extension: 'md' }
      } else if (fileMDX !== null) {
        return { mdDocument: fileMDX.text, extension: 'mdx' }
      } else {
        return null
      }
    },
    meta: {
      errorMessage: `Failed to fetch singleton: ${slug}`
    },
    enabled
  })
}
