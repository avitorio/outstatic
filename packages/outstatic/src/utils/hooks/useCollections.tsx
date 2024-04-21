import { GET_COLLECTIONS } from '@/graphql/queries/collections'
import request from 'graphql-request'
import { useQuery } from '@tanstack/react-query'
import { useOutstaticNew } from './useOstData'

export const useCollections = () => {
  const {
    repoOwner,
    repoSlug,
    repoBranch,
    monorepoPath,
    contentPath,
    session,
    isPending
  } = useOutstaticNew()

  return useQuery({
    queryKey: ['collections', { repoOwner, repoSlug, repoBranch, contentPath }],
    queryFn: async () => {
      const data =
        isPending || !repoOwner || !repoSlug || !repoBranch
          ? null
          : await request(
              'https://api.github.com/graphql',
              GET_COLLECTIONS,
              // variables are type-checked too!
              {
                owner: repoOwner,
                name: repoSlug,
                contentPath:
                  `${repoBranch}:${
                    monorepoPath ? monorepoPath + '/' : ''
                  }${contentPath}` || ''
              },
              {
                authorization: `Bearer ${session?.access_token}`
              }
            )

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
