import {
  generateGetFileInformationQuery,
  generateGetSchemasQuery
} from '@/graphql/queries/metadata'
import useOutstatic from '@/utils/hooks/useOutstatic'
import { useQuery } from '@tanstack/react-query'

type RepoObject = {
  oid: string
  text: string
  commitUrl: string
  entries: TreeEntry[]
}

type FileInformationDataType = {
  repository: {
    object: RepoObject
    [key: string]: RepoObject
  }
}

type TreeEntry = {
  object: RepoObject
  type: 'tree' | 'blob'
  path: string
}

type SchemaFolder = {
  ostFolder: string
  schemaPath: string
  collection: string
}

type ExternalPath = {
  id: number
  folder: string
  collection: string
}

export type SchemasQuery = {
  repository?: {
    [key: string]: { text?: string | null } | {} | null
  } | null
}

export const useGetFileInformation = ({
  enabled = true
}: {
  enabled?: boolean
} = {}) => {
  const { repoOwner, repoSlug, repoBranch, ostContent, session, gqlClient } =
    useOutstatic()

  return useQuery({
    queryKey: ['file-info', { filePath: `${repoBranch}:${ostContent}` }],
    queryFn: async () => {
      // Fetch Outstatic content folder
      const data = await fetchOutstaticContentFolder()

      const outstaticFolders = data.repository?.folder0?.entries ?? []

      // Process folders
      const { foldersWithoutSchema, foldersWithSchema } =
        processFolders(outstaticFolders)

      // Fetch and process schemas
      const schemaContents = await fetchSchemas(foldersWithSchema)
      const externalPaths = processSchemaContents(schemaContents)

      // Fetch external files
      const externalFilesData =
        externalPaths.length > 0
          ? await fetchExternalFiles(externalPaths)
          : null

      // Combine all entries
      const finalEntries = combineEntries(
        outstaticFolders,
        externalPaths,
        externalFilesData
      )

      const finalRepository = {
        id: data.repository.id,
        object: {
          ...data.repository?.object,
          entries: finalEntries
        }
      }

      return { repository: finalRepository, foldersWithoutSchema }
    },
    meta: {
      errorMessage: `Failed to fetch metadata.`
    },
    enabled
  })

  async function fetchOutstaticContentFolder() {
    const GET_OUTSTATIC_CONTENT_FOLDER = generateGetFileInformationQuery({
      paths: [ostContent],
      branch: repoBranch
    })

    return await gqlClient.request<FileInformationDataType>(
      GET_OUTSTATIC_CONTENT_FOLDER,
      {
        owner: repoOwner || session?.user?.login || '',
        name: repoSlug
      }
    )
  }

  function processFolders(folders: TreeEntry[]) {
    const foldersWithoutSchema: string[] = []
    const foldersWithSchema: SchemaFolder[] = []

    folders.forEach((entry) => {
      if (entry.type === 'tree') {
        const schemaEntry = entry.object.entries.find((subEntry) =>
          subEntry.path.endsWith('schema.json')
        )
        if (!schemaEntry) {
          foldersWithoutSchema.push(entry.path)
        } else {
          foldersWithSchema.push({
            ostFolder: entry.path,
            schemaPath: schemaEntry.path,
            collection: entry.path.replace('outstatic/content/', '')
          })
        }
      }
    })

    return { foldersWithoutSchema, foldersWithSchema }
  }

  async function fetchSchemas(foldersWithSchema: SchemaFolder[]) {
    const GET_SCHEMAS_QUERY = generateGetSchemasQuery({
      paths: foldersWithSchema.map((folder) => folder.schemaPath),
      branch: repoBranch
    })

    return await gqlClient.request<SchemasQuery>(GET_SCHEMAS_QUERY, {
      owner: repoOwner || session?.user?.login || '',
      name: repoSlug
    })
  }

  function processSchemaContents(schemaContents: SchemasQuery): ExternalPath[] {
    const externalPaths: ExternalPath[] = []
    Object.values(schemaContents?.repository ?? {}).forEach((value) => {
      if (typeof value === 'object' && value !== null && 'text' in value) {
        const parsedValue = JSON.parse(value.text ?? '{}')
        if (
          parsedValue.path &&
          !parsedValue.path.startsWith('outstatic/content/')
        ) {
          externalPaths.push({
            id: externalPaths.length,
            folder: parsedValue.path,
            collection: parsedValue.path.split('/').pop() || ''
          })
        }
      }
    })
    return externalPaths
  }

  async function fetchExternalFiles(externalPaths: ExternalPath[]) {
    const GET_EXTERNAL_FILES = generateGetFileInformationQuery({
      paths: externalPaths.map((path) => path.folder),
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

  function combineEntries(
    outstaticFolders: TreeEntry[],
    externalPaths: ExternalPath[],
    externalFilesData: FileInformationDataType | null
  ): TreeEntry[] {
    if (!externalFilesData || externalPaths.length === 0) {
      return outstaticFolders
    }

    return outstaticFolders.map((entry) => {
      const externalEntry = externalPaths.find((path) =>
        entry.path.endsWith(path.collection)
      )
      if (externalEntry) {
        const externalFolder =
          externalFilesData.repository[`folder${externalEntry.id}`]
        if (externalFolder && 'entries' in externalFolder) {
          return {
            path: externalEntry.folder,
            type: 'tree',
            object: {
              oid: '',
              text: '',
              commitUrl: '',
              entries: externalFolder.entries as TreeEntry[]
            }
          }
        }
      }
      return entry
    })
  }
}
