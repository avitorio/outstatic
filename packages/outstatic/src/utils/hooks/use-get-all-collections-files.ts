import { generateGetFileInformationQuery } from '@/graphql/queries/metadata'
import { useOutstatic } from '@/utils/hooks/use-outstatic'
import { useQuery } from '@tanstack/react-query'
import { useCollections } from './use-collections'
import { useSingletons } from './use-singletons'

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
      entries?: TreeEntry[]
      oid?: string
      commitUrl?: string
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
  const { refetch: refetchSingletons } = useSingletons({ enabled: false })

  return useQuery({
    queryKey: ['file-info', { filePath: `${repoBranch}:${ostContent}` }],
    queryFn: async () => {
      const [{ data: collectionsData }, { data: singletonsData }] =
        await Promise.all([refetchCollections(), refetchSingletons()])
      const collections = collectionsData ?? []
      const singletons = singletonsData ?? []

      if (collections.length === 0 && singletons.length === 0) {
        throw new Error('No collections or singletons data found')
      }

      const fullData = collections
      const singletonDirectories = Array.from(
        new Set(singletons.map((singleton) => singleton.directory))
      )

      // Fetch external files
      const externalFilesData =
        fullData.length + singletons.length > 0
          ? await fetchExternalFiles(
              fullData,
              singletons.map((singleton) => singleton.path)
            )
          : null

      // Combine all entries
      const finalEntries = combineEntries(
        externalFilesData?.repository ?? {},
        singletons.map((singleton) => singleton.path)
      )

      const finalRepository = {
        object: {
          entries: finalEntries
        }
      }

      return {
        repository: finalRepository,
        collections: fullData,
        singletonPaths: singletons.map((singleton) => singleton.path),
        singletonDirectories
      }
    },
    meta: {
      errorMessage: `Failed to fetch metadata.`
    },
    enabled
  })

  function combineEntries(
    obj: FileInformationDataType['repository'],
    singletonPaths: string[]
  ) {
    let allEntries: TreeEntry[] = []

    for (const key in obj) {
      const entry = obj[key]
      if (key.startsWith('folder') && entry.entries) {
        allEntries = allEntries.concat(entry.entries)
      }
      if (key.startsWith('singleton') && entry.oid && entry.commitUrl) {
        const index = Number(key.replace('singleton', ''))
        const path = singletonPaths[index]
        if (path) {
          allEntries.push({
            path,
            type: 'blob',
            object: {
              oid: entry.oid,
              commitUrl: entry.commitUrl,
              text: '',
              entries: []
            }
          })
        }
      }
    }

    return allEntries
  }

  async function fetchExternalFiles(
    externalPaths: any[],
    singletonPaths: string[]
  ) {
    const GET_EXTERNAL_FILES = generateGetFileInformationQuery({
      paths: externalPaths.map((path) => path.path),
      singletonPaths,
      branch: repoBranch
    })

    return await gqlClient.request<FileInformationDataType>(
      GET_EXTERNAL_FILES,
      {
        owner: repoOwner || session?.user?.login || '',
        name: repoSlug,
        ...Object.fromEntries(
          singletonPaths.map((path, index) => [
            `singleton${index}`,
            `${repoBranch}:${path}`
          ])
        )
      }
    )
  }
}
