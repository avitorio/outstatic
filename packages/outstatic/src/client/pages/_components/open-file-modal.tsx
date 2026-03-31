import { Button } from '@/components/ui/shadcn/button'
import { useState } from 'react'
import GithubExplorer from '@/components/ui/outstatic/github-explorer'
import PathBreadcrumbs from '@/components/ui/outstatic/path-breadcrumb'
import { FileText } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/shadcn/dialog'

type OpenFileModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (filePath: string) => void
}

export default function OpenFileModal({
  open,
  onOpenChange,
  onSelect
}: OpenFileModalProps) {
  const [path, setPath] = useState('')
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  const handleFileSelect = (filePath: string) => {
    setSelectedFile(filePath)
  }

  const handleOpen = () => {
    if (selectedFile) {
      onSelect(selectedFile)
    }
  }

  const resetModal = () => {
    setPath('')
    setSelectedFile(null)
  }

  const selectedFileName = selectedFile
    ? selectedFile.substring(selectedFile.lastIndexOf('/') + 1)
    : null

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          resetModal()
        }
        onOpenChange(isOpen)
      }}
    >
      <DialogContent className="md:max-w-xl">
        <DialogHeader>
          <DialogTitle>Open File</DialogTitle>
          <DialogDescription>
            Select a markdown file (.md or .mdx) from your repository to open as
            a singleton.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <PathBreadcrumbs path={'/' + path} />
          <GithubExplorer
            path={path}
            setPath={setPath}
            fileExtensions={['.md', '.mdx']}
            onFileSelect={handleFileSelect}
          />

          {selectedFile && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{selectedFileName}</span>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button onClick={handleOpen} disabled={!selectedFile}>
              Open
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
