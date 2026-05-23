import { useEffect, useState } from 'react'
import { Block } from '@/utils/metadata/types'
import { useUpdateBlocks } from '@/utils/hooks/use-update-blocks'
import { usePermissions } from '@/utils/hooks/use-permissions'
import { SpinnerIcon } from '@/components/ui/outstatic/spinner-icon'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/shadcn/alert-dialog'
import { Button } from '@/components/ui/shadcn/button'

type DeleteBlockDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  block: Block | null
  onDeleted: (blockName: string) => void
}

export const DeleteBlockDialog = ({
  open,
  onOpenChange,
  block,
  onDeleted
}: DeleteBlockDialogProps) => {
  const [deleting, setDeleting] = useState(false)
  const { deleteBlock } = useUpdateBlocks()
  const { canManageCollections } = usePermissions()

  useEffect(() => {
    if (!canManageCollections && open) {
      onOpenChange(false)
    }
  }, [canManageCollections, onOpenChange, open])

  const handleDialogChange = (value: boolean) => {
    if (!value) {
      setDeleting(false)
    }

    onOpenChange(value)
  }

  const handleDelete = async () => {
    if (!canManageCollections || !block) {
      return
    }

    setDeleting(true)

    try {
      await deleteBlock(block.name)
      onDeleted(block.name)
      handleDialogChange(false)
    } catch {
      setDeleting(false)
    }
  }

  if (!canManageCollections || !block) {
    return null
  }

  return (
    <AlertDialog open={open} onOpenChange={handleDialogChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {block.name}</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this block?
            <br />
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline" onClick={() => handleDialogChange(false)}>
              Cancel
            </Button>
          </AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={deleting}
            onClick={handleDelete}
          >
            {deleting ? (
              <>
                <SpinnerIcon className="mr-2 text-background" />
                Deleting
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
