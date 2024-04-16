import { useGetRepoFiles } from '@/utils/hooks/useGetRepoFiles'
import { useEffect, useState } from 'react'
import { Tree, TreeDataItem } from './file-tree'
import { Folder } from 'lucide-react'

function GithubExplorer() {
  const [path, setPath] = useState('')

  const [folders, setFolders] = useState<TreeDataItem[]>([])

  const { data } = useGetRepoFiles({ path })

  const handleSelectChange = (item: TreeDataItem | undefined) => {
    if (item === undefined) return
    setPath(item.id)
  }

  useEffect(() => {
    if (data !== undefined && folders !== undefined) {
      setFolders(data)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, data])

  return (
    <Tree
      data={folders}
      className="flex-shrink-0 w-[28rem] h-[24rem] border-[1px]"
      onSelectChange={(item) => handleSelectChange(item)}
      folderIcon={Folder}
      itemIcon={Folder}
    />
  )
}

export default GithubExplorer
