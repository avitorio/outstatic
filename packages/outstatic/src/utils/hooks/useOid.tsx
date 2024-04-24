import { Commit, Repository } from '@/graphql/gql/graphql'
import { OID } from '@/graphql/queries/oid'
import { useOstSession } from '@/utils/auth/hooks'
import { useQuery } from '@tanstack/react-query'
import request from 'graphql-request'
import { useCallback } from 'react'
import { useOutstaticNew } from './useOstData'

const useOid = () => {
  const { repoSlug, repoBranch, repoOwner } = useOutstaticNew()
  const { session } = useOstSession()
  const { refetch: oidQuery } = useQuery({
    queryKey: ['oid'],
    queryFn: async () => {
      try {
        const { repository } = await request<{ repository: Repository }>(
          'https://api.github.com/graphql',
          OID,
          {
            owner: repoOwner || session?.user?.login || '',
            name: repoSlug,
            branch: repoBranch
          },
          {
            authorization: `Bearer ${session?.access_token}`
          }
        )

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
    console.log('yo')
    const { data } = await oidQuery()
    return data
  }, [oidQuery])

  return fetchOid
}

export default useOid
