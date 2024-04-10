import { GET_COLLECTIONS } from '@/graphql/queries/collections'
import request from 'graphql-request'
// import useOutstatic from './useOutstatic'
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
      if (!repoOwner || !repoSlug || !repoBranch || !contentPath) {
        return []
      }
      const data = isPending
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

      //@ts-ignore
      let collections = data?.repository?.object?.entries
        //@ts-ignore
        ?.map((entry) => (entry.type === 'tree' ? entry.name : undefined))
        .filter(Boolean) as string[]

      return collections
    }
  })
}
