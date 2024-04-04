import { GET_COLLECTIONS } from '@/graphql/queries/collections'
import request from 'graphql-request'
import useOutstatic from './useOutstatic'
import { useQuery } from '@tanstack/react-query'

export const useCollections = () => {
  const {
    repoOwner,
    repoSlug,
    repoBranch,
    monorepoPath,
    contentPath,
    session
  } = useOutstatic()

  const { isPending, error, data, isFetching } = useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const data = await request(
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

  return { isPending, error, data, isFetching }
}
