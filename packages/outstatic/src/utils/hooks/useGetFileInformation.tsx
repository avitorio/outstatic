import { GET_FILE_INFORMATION } from '@/graphql/queries/metadata'
import { useQuery } from '@tanstack/react-query'
import request from 'graphql-request'
import { useOutstaticNew } from './useOstData'

type RepoObject = {
  oid: string
  text: string
  commitUrl: string
  entries: TreeEntry[]
}

type FileInformationDataType = {
  repository: {
    object: RepoObject
  }
}

type TreeEntry = {
  name: string
  object: RepoObject
  type: 'tree' | 'blob'
  path: string
}

export const useGetFileInformation = ({
  enabled = true
}: {
  enabled?: boolean
} = {}) => {
  const { repoOwner, repoSlug, repoBranch, ostContent, session } =
    useOutstaticNew()

  const filePath = `${repoBranch}:${ostContent}/metadata.json`

  return useQuery({
    queryKey: ['metadata', { filePath }],
    queryFn: async () =>
      await request<FileInformationDataType>(
        'https://api.github.com/graphql',
        GET_FILE_INFORMATION,
        {
          owner: repoOwner || session?.user?.login || '',
          name: repoSlug,
          filePath
        },
        {
          authorization: `Bearer ${session?.access_token}`
        }
      ),
    meta: {
      errorMessage: `Failed to fetch metadata.`
    },
    enabled
  })
}
