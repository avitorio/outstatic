import { useOidLazyQuery } from '@/graphql/generated'
import { useOstSession } from '@/utils/auth/hooks'
import { useCallback } from 'react'
import useOutstatic from './useOutstatic'

const useOid = () => {
  const { repoSlug, repoBranch, repoOwner } = useOutstatic()
  const { session } = useOstSession()
  const [oidQuery] = useOidLazyQuery({
    variables: {
      owner: repoOwner || session?.user?.login || '',
      name: repoSlug,
      branch: repoBranch
    },
    fetchPolicy: 'no-cache'
  })

  const fetchOid = useCallback(async () => {
    const { data: oidData, error: oidError } = await oidQuery()
    if (oidError) {
      throw oidError
    }

    if (oidData?.repository?.ref?.target?.__typename !== 'Commit') {
      throw new Error('No valid oid found')
    }

    if (
      typeof oidData.repository.ref.target.history.nodes?.[0]?.oid !== 'string'
    ) {
      throw new Error('Received a non-string oid')
    }

    return oidData.repository.ref.target.history.nodes[0].oid
  }, [oidQuery])

  return fetchOid
}

export default useOid
