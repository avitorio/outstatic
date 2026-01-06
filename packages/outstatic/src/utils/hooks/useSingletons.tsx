import { GET_COLLECTIONS } from '@/graphql/queries/collections'
import { SingletonsType } from '@/types'
import { useOutstatic } from '@/utils/hooks/useOutstatic'
import { useQuery } from '@tanstack/react-query'
import { sentenceCase } from 'change-case'

type UseSingletonsOptions = {
  enabled?: boolean
}

const MD_MDX_REGEXP = /\.mdx?$/i

export function useSingletons(options?: UseSingletonsOptions) {
  const { enabled = true } = options ?? {}
  const { repoOwner, repoSlug, repoBranch, isPending, gqlClient, ostContent } =
    useOutstatic()

  return useQuery({
    queryKey: ['singletons', { repoOwner, repoSlug, repoBranch, ostContent }],
    queryFn: async (): Promise<SingletonsType> => {
      try {
        // Query the _singletons directory to discover singleton files
        const data =
          isPending || !repoOwner || !repoSlug || !repoBranch
            ? null
            : await gqlClient.request(GET_COLLECTIONS, {
                owner: repoOwner,
                name: repoSlug,
                contentPath: `${repoBranch}:${ostContent}/_singletons`
              })

        if (!data || data?.repository?.object === null) {
          // No _singletons folder exists yet
          return []
        }

        const { entries } = data?.repository?.object as {
          entries: { name: string; type: string }[]
        }

        // Filter for .md/.mdx files (blobs) and extract singleton info
        const singletons = entries
          .filter(
            (entry) => entry.type === 'blob' && MD_MDX_REGEXP.test(entry.name)
          )
          .map((entry) => {
            const slug = entry.name.replace(MD_MDX_REGEXP, '')
            return {
              title: sentenceCase(slug, {
                split: (str) => str.split(/([^A-Za-z0-9\.]+)/g).filter(Boolean)
              }),
              slug
            }
          })

        return singletons
      } catch (error) {
        console.error('Error fetching singletons:', error)
        return []
      }
    },
    enabled:
      enabled && !!repoOwner && !!repoSlug && !!repoBranch && !!ostContent
  })
}
