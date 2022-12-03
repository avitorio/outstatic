import { useContext } from 'react'
import { OutstaticContext } from '../context'
import { useDocumentQuery } from '../graphql/generated'
import { useOstSession } from './auth/hooks'

type useFileQueryProps = {
  file: string
  skip?: boolean
}

const useFileQuery = ({ file, skip = false }: useFileQueryProps) => {
  const { repoOwner, repoSlug, repoBranch, contentPath, monorepoPath } =
    useContext(OutstaticContext)
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
