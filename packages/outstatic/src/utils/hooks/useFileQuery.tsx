import { useDocumentQuery } from '@/graphql/generated'
import { useOstSession } from '@/utils/auth/hooks'
import useOutstatic from './useOutstatic'

type useFileQueryProps = {
  file: string
  skip?: boolean
}

const useFileQuery = ({ file, skip = false }: useFileQueryProps) => {
  const { repoOwner, repoSlug, repoBranch, contentPath, monorepoPath } =
    useOutstatic()
  const { session } = useOstSession()
  const data = useDocumentQuery({
    variables: {
      owner: repoOwner || session?.user?.login || '',
      name: repoSlug,
      filePath: `${repoBranch}:${
        monorepoPath ? monorepoPath + '/' : ''
      }${contentPath}/${file}`
    },
    fetchPolicy: 'network-only',
    skip
  })

  return data
}

export default useFileQuery
