import { useGetRepoFolders } from '@/utils/hooks/useGetRepoFolders'
import { useEffect, useState } from 'react'
import { Tree, TreeDataItem } from '@/components/ui/outstatic/file-tree'
import { Folder, FolderRoot } from 'lucide-react'
import { cn } from '@/utils/ui'

type GithubExplorerProps = {
  path: string
  setPath: (path: string) => void
  className?: string
  hideRoot?: boolean
}

function GithubExplorer({
  path,
  setPath,
  className,
  hideRoot
}: GithubExplorerProps) {
  const [folders, setFolders] = useState<TreeDataItem[]>([])

  const { data, isPending } = useGetRepoFolders({ path })

  const handleSelectChange = (item: TreeDataItem | undefined) => {
    if (path === item?.id) return
    if (item === undefined) return
    setPath(item.id)
  }

  useEffect(() => {
    if (data !== undefined && folders !== undefined) {
      hideRoot
        ? setFolders(data)
        : setFolders([{ id: '', name: '', icon: FolderRoot }, ...data])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, data])

  return (
    <Tree
      isPending={isPending}
      data={folders}
      className={cn('shrink-0 w-full h-64 border-[1px]', className)}
      onSelectChange={(item) => handleSelectChange(item)}
      folderIcon={Folder}
      itemIcon={Folder}
    />
  )
}

export default GithubExplorer
