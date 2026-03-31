import { Tree, TreeDataItem } from '@/components/ui/outstatic/file-tree'
import { useGetRepoFiles } from '@/utils/hooks/use-get-repo-files'
import { cn } from '@/utils/ui'
import { Folder, FolderRoot } from 'lucide-react'
import { useMemo } from 'react'

type GithubExplorerProps = {
  path: string
  setPath: (path: string) => void
  className?: string
  hideRoot?: boolean
  /** When provided, also shows files with these extensions (e.g., ['.md', '.mdx']) */
  fileExtensions?: string[]
  /** Callback when a file is selected (only used when fileExtensions is provided) */
  onFileSelect?: (filePath: string) => void
}

function GithubExplorer({
  path,
  setPath,
  className,
  hideRoot,
  fileExtensions,
  onFileSelect
}: GithubExplorerProps) {
  const { data, isFetching } = useGetRepoFiles({ path, fileExtensions })
  const items = useMemo<TreeDataItem[]>(() => {
    if (data === undefined) return []

    const shouldShowRoot = !hideRoot && fileExtensions === undefined
    return shouldShowRoot
      ? [{ id: '', name: '.', icon: FolderRoot }, ...data]
      : data
  }, [data, hideRoot, fileExtensions])

  const isFile = (item: TreeDataItem) => {
    if (!fileExtensions) return false
    return !item.children && fileExtensions.some((ext) => item.id.endsWith(ext))
  }

  const handleSelectChange = (item: TreeDataItem | undefined) => {
    if (item === undefined) return

    if (fileExtensions && isFile(item)) {
      // File selected - call onFileSelect callback
      onFileSelect?.(item.id)
    } else {
      // Folder selected - update path for navigation
      if (path !== item.id) {
        setPath(item.id)
      }
    }
  }

  return (
    <Tree
      isPending={isFetching}
      data={items}
      className={cn('shrink-0 w-full h-64 border-[1px]', className)}
      onSelectChange={(item) => handleSelectChange(item)}
      folderIcon={Folder}
      itemIcon={Folder}
    />
  )
}

export default GithubExplorer
