import request from 'graphql-request'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useOutstaticNew } from './useOstData'
import { GET_FILES } from '@/graphql/queries/files'
import { TreeDataItem } from '@/components/ui/file-tree'

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
      // If no folder is found at any stage, return undefined
      return undefined
    }
    if (path[path.length - 1] === part) {
      return foundFolder
    }
    // Navigate to the next level
    currentFolders = foundFolder.children || []
  }

  // Return the last found folder if the entire path is matched
  return currentFolders.length > 0 ? currentFolders[0] : undefined
}

function checkForTreeInEntries(entries: TreeEntry[]): boolean {
  return entries.some((entry) => entry.type === 'tree')
}

function filterFolders(entries: TreeEntry[]) {
  const result = []

  for (const entry of entries) {
    // Check if the entry is a folder (type 'tree')
    if (entry.type === 'tree' && entry.name !== '.github') {
      const folder = {
        id: entry.path,
        name: entry.name
      } as TreeDataItem

      // Recursively get children if there are any
      if (
        entry.object?.entries &&
        checkForTreeInEntries(entry.object?.entries)
      ) {
        folder.children = []
      }

      result.push(folder)
    }
  }

  return result
}

export const useGetRepoFiles = ({ path = '' }: { path?: string } = {}) => {
  const queryClient = useQueryClient()
  const { repoOwner, repoSlug, repoBranch, session } = useOutstaticNew()

  return useQuery({
    queryKey: [
      `files_${repoOwner}/${repoSlug}/${repoBranch}/${path}`,
      { path }
    ],
    queryFn: async (): Promise<TreeDataItem[] | undefined> => {
      const currentTree = queryClient.getQueryData<TreeDataItem[]>([
        `files_${repoOwner}/${repoSlug}/${repoBranch}/${path}`,
        { path }
      ])

      if (currentTree) return currentTree

      let parentPath = path.includes('/')
        ? path.substring(0, path.lastIndexOf('/'))
        : ''

      const parentTree = queryClient.getQueryData<TreeDataItem[]>([
        `files_${repoOwner}/${repoSlug}/${repoBranch}/${parentPath}`,
        { path: parentPath }
      ])

      const { repository } = await request(
        'https://api.github.com/graphql',
        GET_FILES,
        {
          owner: repoOwner,
          name: repoSlug,
          contentPath: `${repoBranch}:${path}`
        },
        {
          authorization: `Bearer ${session?.access_token}`
        }
      )

      if (repository?.object === null) throw new Error('Ouch.')

      const { entries } = repository?.object as Tree

      const folders = filterFolders(entries)

      if (folders.length === 0) {
        return parentTree
      }

      if (parentTree) {
        const pathArray = path.split('/')

        // find the folder in the cached data
        const folder = findFolderByPath(pathArray, parentTree)

        // if the folder is found, add the new folders to it
        if (folder) {
          folder.children = folders
        }

        return parentTree
      }

      return folders
    },
    meta: {
      errorMessage: `Failed to fetch folders for ${path}`
    }
  })
}
