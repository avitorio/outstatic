import { createCommitApi } from '@/utils/createCommitApi'
import { hashFromUrl } from '@/utils/hashFromUrl'
import { useCreateCommit } from '@/utils/hooks/useCreateCommit'
import useOid from '@/utils/hooks/useOid'
import useOutstatic from '@/utils/hooks/useOutstatic'
import { stringifyMedia } from '@/utils/metadata/stringify'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/shadcn/button'
import { useGetMediaFiles } from '@/utils/hooks/useGetMediaFiles'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/shadcn/alert-dialog'
import { SpinnerIcon } from '@/components/ui/outstatic/spinner-icon'
import { toast } from 'sonner'

type DeleteDocumentButtonProps = {
  disabled?: boolean
  onComplete?: () => void
  path: string
  filename: string
  className?: string
  notFound?: boolean
}

export const DeleteMediaButton = ({
  disabled = false,
  onComplete = () => {},
  path,
  filename,
  className,
  notFound = false
}: DeleteDocumentButtonProps) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { repoOwner, repoSlug, repoBranch, session, mediaJsonPath } =
    useOutstatic()
  const fetchOid = useOid()

  const mutation = useCreateCommit()

  const { refetch: refetchMedia } = useGetMediaFiles({ enabled: false })

  const deleteMedia = async () => {
    setDeleting(true)
    try {
      const [{ data }, oid] = await Promise.all([refetchMedia(), fetchOid()])
      if (!data || !oid) throw new Error('Failed to fetch media or oid')
      const { media, commitUrl } = data
      const owner = repoOwner || session?.user?.login || ''

      const capi = createCommitApi({
        message: `chore: remove ${filename}`,
        owner,
        oid: oid ?? '',
        name: repoSlug,
        branch: repoBranch
      })

      if (!notFound) {
        // remove media file if found
        capi.removeFile(`${path}`)
      }

      // remove media from media.json
      media.generated = new Date().toISOString()
      media.commit = hashFromUrl(commitUrl)
      const newMeta = media.media.filter((file) => file.filename !== filename)
      capi.replaceFile(
        mediaJsonPath,
        stringifyMedia({ ...media, media: newMeta })
      )

      const input = capi.createInput()

      toast.promise(mutation.mutateAsync(input), {
        loading: 'Deleting media...',
        success: async () => {
          await refetchMedia()
          if (onComplete) onComplete()
          return 'Media deleted successfully'
        },
        error: 'Failed to delete media'
      })

      setShowDeleteModal(false)
    } catch (error) {
      console.log(error)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => setShowDeleteModal(true)}
        type="button"
        disabled={disabled}
        className={className}
        title="Delete media file"
        size="icon"
        variant="ghost"
      >
        <span className="sr-only">Delete media file</span>
        <Trash2 className="stroke-foreground" />
      </Button>
      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Media</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this media file?
              <br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteMedia}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <SpinnerIcon className="mr-2 h-4 w-4" />
                  Deleting
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
