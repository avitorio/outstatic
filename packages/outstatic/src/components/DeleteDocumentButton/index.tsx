import { MDExtensions } from '@/types'
import { createCommitApi } from '@/utils/createCommitApi'
import { hashFromUrl } from '@/utils/hashFromUrl'
import { useCreateCommit } from '@/utils/hooks/useCreateCommit'
import { useGetMetadata } from '@/utils/hooks/useGetMetadata'
import useOid from '@/utils/hooks/useOid'
import useOutstatic from '@/utils/hooks/useOutstatic'
import { stringifyMetadata } from '@/utils/metadata/stringify'
import { Trash } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/shadcn/button'
import { SpinnerIcon } from '../ui/outstatic/spinner-icon'
import { toast } from 'sonner'
import { useGetDocuments } from '@/utils/hooks/useGetDocuments'
import { useCollections } from '@/utils/hooks'
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

type DeleteDocumentButtonProps = {
  slug: string
  extension: MDExtensions
  disabled?: boolean
  onComplete?: () => void
  collection: string
  className?: string
}

const DeleteDocumentButton = ({
  slug,
  extension,
  disabled = false,
  onComplete = () => {},
  collection,
  className
}: DeleteDocumentButtonProps) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { repoOwner, repoSlug, repoBranch, ostContent, session } =
    useOutstatic()
  const fetchOid = useOid()

  const mutation = useCreateCommit()

  const { refetch: refetchDocuments } = useGetDocuments({ enabled: false })
  const { refetch: refetchMetadata } = useGetMetadata({ enabled: false })
  const { refetch: refetchCollections } = useCollections({
    enabled: false,
    detailed: true
  })

  const deleteDocument = async (slug: string) => {
    setDeleting(true)
    try {
      const [{ data }, oid, { data: collections }] = await Promise.all([
        refetchMetadata(),
        fetchOid(),
        refetchCollections()
      ])

      if (!data) throw new Error('Failed to fetch metadata')
      if (!oid) throw new Error('Failed to fetch oid')
      if (!collections) throw new Error('Failed to fetch schema')
      const { metadata, commitUrl } = data
      const owner = repoOwner || session?.user?.login || ''

      const capi = createCommitApi({
        message: `feat(${collection}): remove ${slug}`,
        owner,
        oid: oid ?? '',
        name: repoSlug,
        branch: repoBranch
      })

      const collectionPath = collections?.fullData?.find(
        (col) => col.name === collection
      )?.path

      // remove post markdown file
      capi.removeFile(`${collectionPath}/${slug}.${extension}`)

      // remove post from metadata.json
      metadata.generated = new Date().toISOString()
      metadata.commit = hashFromUrl(commitUrl)
      const newMeta = metadata.metadata.filter((post) => post.slug !== slug)
      capi.replaceFile(
        `${ostContent}/metadata.json`,
        stringifyMetadata({ ...metadata, metadata: newMeta })
      )

      const input = capi.createInput()

      toast.promise(mutation.mutateAsync(input), {
        loading: 'Deleting document...',
        success: () => {
          refetchDocuments()
          return 'Document deleted successfully'
        },
        error: 'Failed to delete document'
      })
      setShowDeleteModal(false)
      if (onComplete) onComplete()
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <>
      <Button
        onClick={() => setShowDeleteModal(true)}
        type="button"
        disabled={disabled}
        className={className}
        title="Delete document"
        size="icon"
        variant="ghost"
      >
        <span className="sr-only">Delete document</span>
        <Trash className="stroke-foreground" />
      </Button>
      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot
              be&nbsp;undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteModal(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteDocument(slug)
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <SpinnerIcon className="text-background mr-2" />
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

export default DeleteDocumentButton
