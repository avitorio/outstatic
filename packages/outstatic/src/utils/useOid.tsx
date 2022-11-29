import { useContext, useCallback } from 'react'
import { OutstaticContext } from '../context'
import { useOidLazyQuery } from '../graphql/generated'
import { useOstSession } from './auth/hooks'

const useOid = () => {
  const { repoSlug, repoBranch, repoOwner } = useContext(OutstaticContext)
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
    try {
      const { data: oidData, error: oidError } = await oidQuery()
      if (oidError) {
        console.error(oidError)
      }

      if (oidData?.repository?.ref?.target?.__typename !== 'Commit') {
        return undefined
      }

      return oidData.repository.ref.target.history.nodes?.[0]?.oid
    } catch (error) {
      console.error(error)
    }
  }, [oidQuery])

  return fetchOid
}

export default useOid
