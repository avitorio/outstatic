import { TreeDataItem } from '@/components/ui/outstatic/file-tree'
import { GET_FILES } from '@/graphql/queries/files'
import { useOutstatic } from '@/utils/hooks/useOutstatic'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FileText } from 'lucide-react'

type Tree = {
  path: string
  entries: TreeEntry[]
}

type TreeEntry = {
  id: string
  path: string
  entries: TreeEntry[]
  name: string
  type: string
  object: TreeEntry
}

export function deepCloneTree(items: TreeDataItem[]): TreeDataItem[] {
  return items.map((item) => ({
    ...item,
    children: item.children ? deepCloneTree(item.children) : undefined
  }))
}

function findFolderByPath(
  path: string[],
  folders: TreeDataItem[]
): TreeDataItem | undefined {
  let currentFolders: TreeDataItem[] = folders

  for (const part of path) {
    const foundFolder = currentFolders.find((folder) => {
      return folder.name === part
    })
    if (!foundFolder) {
      return undefined
    }
    if (path[path.length - 1] === part) {
      return foundFolder
    }
    currentFolders = foundFolder.children || []
  }

  return currentFolders.length > 0 ? currentFolders[0] : undefined
}

function checkForTreeInEntries(entries: TreeEntry[]): boolean {
  return entries.some((entry) => entry.type === 'tree')
}

function checkForMatchingFilesInEntries(
  entries: TreeEntry[],
  fileExtensions: string[]
): boolean {
  return entries.some(
    (entry) =>
      entry.type === 'blob' &&
      fileExtensions.some((ext) => entry.name.endsWith(ext))
  )
}

function filterEntries(entries: TreeEntry[], fileExtensions?: string[]) {
  const folders: TreeDataItem[] = []
  const files: TreeDataItem[] = []

  for (const entry of entries) {
    // Check if the entry is a folder (type 'tree')
    if (entry.type === 'tree' && entry.name !== '.github') {
      const folder: TreeDataItem = {
        id: entry.path,
        name: entry.name
      }

      // Add children property if there are subdirectories or matching files
      if (entry.object?.entries) {
        const hasSubfolders = checkForTreeInEntries(entry.object.entries)
        const hasMatchingFiles =
          fileExtensions &&
          checkForMatchingFilesInEntries(entry.object.entries, fileExtensions)
        if (hasSubfolders || hasMatchingFiles) {
          folder.children = []
        }
      }

      folders.push(folder)
    }

    // Check if the entry is a file (type 'blob') with matching extension
    if (entry.type === 'blob' && fileExtensions) {
      const matchesExtension = fileExtensions.some((ext) =>
        entry.name.endsWith(ext)
      )
      if (matchesExtension) {
        files.push({
          id: entry.path,
          name: entry.name,
          icon: FileText
        })
      }
    }
  }

  // Return folders first, then files
  return fileExtensions ? [...folders, ...files] : folders
}

export const useGetRepoFiles = ({
  path = '',
  enabled = true,
  fileExtensions
}: {
  path?: string
  enabled?: boolean
  /** When provided, also includes files with these extensions (e.g., ['.md', '.mdx']) */
  fileExtensions?: string[]
}) => {
  const queryClient = useQueryClient()
  const { repoOwner, repoSlug, repoBranch, session, gqlClient } = useOutstatic()

  const extensionsKey = fileExtensions?.join(',') ?? ''

  return useQuery({
    queryKey: [
      `files_${repoOwner}/${repoSlug}/${repoBranch}/${path}`,
      { path, extensions: extensionsKey }
    ],
    queryFn: async (): Promise<TreeDataItem[]> => {
      const currentTree = queryClient.getQueryData<TreeDataItem[]>([
        `files_${repoOwner}/${repoSlug}/${repoBranch}/${path}`,
        { path, extensions: extensionsKey }
      ])

      if (currentTree) return currentTree

      let parentPath = path.includes('/')
        ? path.substring(0, path.lastIndexOf('/'))
        : ''

      const parentTree = queryClient.getQueryData<TreeDataItem[]>([
        `files_${repoOwner}/${repoSlug}/${repoBranch}/${parentPath}`,
        { path: parentPath, extensions: extensionsKey }
      ])

      const { repository } = await gqlClient.request(GET_FILES, {
        owner: repoOwner || session?.user?.login || '',
        name: repoSlug,
        contentPath: `${repoBranch}:${path}`
      })

      if (repository?.object === null) throw new Error('Ouch.')

      const { entries } = repository?.object as Tree

      const items = filterEntries(entries, fileExtensions)

      if (items.length === 0) {
        return parentTree ?? []
      }

      if (parentTree) {
        const pathArray = path.split('/')
        // Clone to ensure React sees a new reference
        const clonedTree = deepCloneTree(parentTree)

        // find the folder in the cloned data
        const folder = findFolderByPath(pathArray, clonedTree)

        // if the folder is found, add the new items to it
        if (folder) {
          folder.children = items
        }

        return clonedTree
      }

      return items
    },
    enabled,
    meta: {
      errorMessage: `Failed to fetch folders for ${path}`
    }
  })
}
