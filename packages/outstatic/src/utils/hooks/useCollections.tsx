import { GET_COLLECTIONS } from '@/graphql/queries/collections'
import request from 'graphql-request'
// import useOutstatic from './useOutstatic'
import { useQuery } from '@tanstack/react-query'
import { useOutstaticNew } from './useOstData'
import { toast } from 'sonner'

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

      if (data?.repository?.object === null) {
        toast.error(
          'No collections found. Please check your content path and try again.'
        )
        return []
      } else {
        //@ts-ignore
        let collections = data?.repository?.object?.entries
          //@ts-ignore
          ?.map((entry) => (entry.type === 'tree' ? entry.name : undefined))
          .filter(Boolean) as string[]

        return collections
      }
    },
    enabled: !!repoOwner && !!repoSlug && !!repoBranch && !!contentPath
  })
}
