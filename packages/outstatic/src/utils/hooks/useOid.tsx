import { Commit, Repository } from '@/graphql/gql/graphql'
import { OID } from '@/graphql/queries/oid'
import useOutstatic from '@/utils/hooks/useOutstatic'
import { useQuery } from '@tanstack/react-query'
import { useCallback } from 'react'

const useOid = () => {
  const { repoSlug, repoBranch, repoOwner, gqlClient, session } = useOutstatic()
  const { refetch: oidQuery } = useQuery({
    queryKey: ['oid'],
    queryFn: async () => {
      try {
        const { repository } = await gqlClient.request<{
          repository: Repository
        }>(OID, {
          owner: repoOwner || session?.user?.login || '',
          name: repoSlug,
          branch: repoBranch
        })

        const target = repository?.ref?.target as Commit

        if (typeof target.history.nodes?.[0]?.oid !== 'string') {
          throw new Error('Received a non-string oid')
        }

        return target.history.nodes[0].oid
      } catch (error) {
        throw error
      }
    },
    enabled: false,
    gcTime: 0
  })

  const fetchOid = useCallback(async () => {
    const { data } = await oidQuery()
    return data
  }, [oidQuery])

  return fetchOid
}

export default useOid
