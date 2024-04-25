import { GET_FILE_INFORMATION } from '@/graphql/queries/metadata'
import { useQuery } from '@tanstack/react-query'
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
  const { repoOwner, repoSlug, repoBranch, ostContent, session, gqlClient } =
    useOutstaticNew()

  const filePath = `${repoBranch}:${ostContent}/metadata.json`

  return useQuery({
    queryKey: ['file-info', { filePath }],
    queryFn: async () =>
      await gqlClient.request<FileInformationDataType>(GET_FILE_INFORMATION, {
        owner: repoOwner || session?.user?.login || '',
        name: repoSlug,
        filePath
      }),
    meta: {
      errorMessage: `Failed to fetch metadata.`
    },
    enabled
  })
}
