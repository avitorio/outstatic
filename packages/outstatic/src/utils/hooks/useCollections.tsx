import { GET_COLLECTIONS } from '@/graphql/queries/collections'
import { useQuery } from '@tanstack/react-query'
import useOutstatic from './useOutstatic'

export const useCollections = () => {
  const {
    repoOwner,
    repoSlug,
    repoBranch,
    monorepoPath,
    contentPath,
    isPending,
    gqlClient,
    session
  } = useOutstatic()

  return useQuery({
    queryKey: ['collections', { repoOwner, repoSlug, repoBranch, contentPath }],
    queryFn: async () => {
      const data =
        isPending || !repoOwner || !repoSlug || !repoBranch
          ? null
          : await gqlClient.request(GET_COLLECTIONS, {
              owner: repoOwner,
              name: repoSlug,
              contentPath:
                `${repoBranch}:${
                  monorepoPath ? monorepoPath + '/' : ''
                }${contentPath}` || ''
            })

      let collections: string[] | null = null

      if (data === null || data?.repository?.object === null) return collections

      const { entries } = data?.repository?.object as {
        entries: { name: string; type: string }[]
      }

      collections = entries
        .map((entry) => (entry.type === 'tree' ? entry.name : undefined))
        .filter(Boolean) as string[]

      return collections
    },
    enabled: !!repoOwner && !!repoSlug && !!repoBranch && !!contentPath
  })
}
