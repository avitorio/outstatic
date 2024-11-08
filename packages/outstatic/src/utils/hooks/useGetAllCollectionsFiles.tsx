import { generateGetFileInformationQuery } from '@/graphql/queries/metadata'
import useOutstatic from '@/utils/hooks/useOutstatic'
import { useQuery } from '@tanstack/react-query'
import { useCollections } from './useCollections'

type TreeEntry = {
  object: {
    oid: string
    text: string
    commitUrl: string
    entries: TreeEntry[]
  }
  type: 'tree' | 'blob'
  path: string
  entries?: TreeEntry[]
}

type FileInformationDataType = {
  repository: {
    [key: string]: {
      entries: TreeEntry[]
    }
  }
}

export type SchemasQuery = {
  repository?: {
    [key: string]: { text?: string | null } | {} | null
  } | null
}

export const useGetAllCollectionsFiles = ({
  enabled = true
}: {
  enabled?: boolean
} = {}) => {
  const { repoOwner, repoSlug, repoBranch, ostContent, session, gqlClient } =
    useOutstatic()

  const { refetch: refetchCollections } = useCollections({
    enabled: false
  })

  return useQuery({
    queryKey: ['file-info', { filePath: `${repoBranch}:${ostContent}` }],
    queryFn: async () => {
      const { data: collectionsData } = await refetchCollections()

      if (!collectionsData || collectionsData.length === 0) {
        throw new Error('No collections data found')
      }

      const fullData = collectionsData ?? []

      // Fetch external files
      const externalFilesData =
        fullData.length > 0 ? await fetchExternalFiles(fullData) : null

      // Combine all entries
      const finalEntries = combineEntries(externalFilesData?.repository ?? {})

      const finalRepository = {
        object: {
          entries: finalEntries
        }
      }

      return { repository: finalRepository, collections: fullData }
    },
    meta: {
      errorMessage: `Failed to fetch metadata.`
    },
    enabled
  })

  function combineEntries(obj: FileInformationDataType['repository']) {
    let allEntries: TreeEntry[] = []

    for (const key in obj) {
      if (key.startsWith('folder') && obj[key].entries) {
        allEntries = allEntries.concat(obj[key].entries)
      }
    }

    return allEntries
  }

  async function fetchExternalFiles(externalPaths: any[]) {
    const GET_EXTERNAL_FILES = generateGetFileInformationQuery({
      paths: externalPaths.map((path) => path.path),
      branch: repoBranch
    })

    return await gqlClient.request<FileInformationDataType>(
      GET_EXTERNAL_FILES,
      {
        owner: repoOwner || session?.user?.login || '',
        name: repoSlug
      }
    )
  }
}
