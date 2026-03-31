import { GET_FILE } from '@/graphql/queries/file'
import { SingletonSchemaType } from '@/types'
import { useOutstatic } from '@/utils/hooks/use-outstatic'
import { useQuery } from '@tanstack/react-query'

export const useGetSingletonSchema = ({
  slug,
  enabled = true
}: {
  slug: string
  enabled?: boolean
}) => {
  const { repoOwner, repoSlug, repoBranch, ostContent, session, gqlClient } =
    useOutstatic()

  const filePath = `${repoBranch}:${ostContent}/_singletons/${slug}.schema.json`

  return useQuery({
    queryKey: ['singleton-schema', { slug }],
    queryFn: async (): Promise<SingletonSchemaType> => {
      try {
        const { repository } = await gqlClient.request(GET_FILE, {
          owner: repoOwner || session?.user?.login || '',
          name: repoSlug,
          filePath
        })

        if (repository?.object === null) return null

        const { text } = repository?.object as { text: string }

        return JSON.parse(text)
      } catch (error) {
        return null
      }
    },
    meta: {
      errorMessage: `Failed to fetch singleton schema for: ${slug}`
    },
    enabled
  })
}
