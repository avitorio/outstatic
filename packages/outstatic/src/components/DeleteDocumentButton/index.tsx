import Modal from '@/components/Modal'
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
import { useGetCollectionSchema } from '@/utils/hooks/useGetCollectionSchema'
import { toast } from 'sonner'
import { useGetDocuments } from '@/utils/hooks/useGetDocuments'

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

  const { refetch: refetchSchema } = useGetCollectionSchema({
    collection,
    enabled: false
  })
  const { refetch: refetchDocuments } = useGetDocuments({ enabled: false })
  const { refetch } = useGetMetadata({ enabled: false })

  const deleteDocument = async (slug: string) => {
    setDeleting(true)
    try {
      const [{ data }, oid, { data: schema }] = await Promise.all([
        refetch(),
        fetchOid(),
        refetchSchema()
      ])
      if (!data) throw new Error('Failed to fetch metadata')
      if (!oid) throw new Error('Failed to fetch oid')
      if (!schema) throw new Error('Failed to fetch schema')
      const { metadata, commitUrl } = data
      const owner = repoOwner || session?.user?.login || ''

      const capi = createCommitApi({
        message: `feat(${collection}): remove ${slug}`,
        owner,
        oid: oid ?? '',
        name: repoSlug,
        branch: repoBranch
      })

      // remove post markdown file
      capi.removeFile(`${schema.path}/${slug}.${extension}`)

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
      {showDeleteModal && (
        <Modal title="Delete Document" close={() => setShowDeleteModal(false)}>
          <div className="space-y-6 p-6 text-left">
            <p className="text-base leading-relaxed text-gray-500">
              Are you sure you want to delete this document?
            </p>
            <p className="text-base leading-relaxed text-gray-500">
              This action cannot be undone.
            </p>
          </div>
          <div className="flex items-center space-x-2 rounded-b border-t p-6 justify-end">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                deleteDocument(slug)
              }}
            >
              {deleting ? (
                <>
                  <SpinnerIcon className="text-background mr-2" />
                  Deleting
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </div>
        </Modal>
      )}
    </>
  )
}

export default DeleteDocumentButton
