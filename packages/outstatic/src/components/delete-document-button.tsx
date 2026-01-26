import { MDExtensions } from '@/types'
import { createCommitApi } from '@/utils/createCommitApi'
import { hashFromUrl } from '@/utils/hashFromUrl'
import { useCreateCommit } from '@/utils/hooks/useCreateCommit'
import { useGetMetadata } from '@/utils/hooks/useGetMetadata'
import useOid from '@/utils/hooks/useOid'
import { useOutstatic } from '@/utils/hooks/useOutstatic'
import { stringifyMetadata } from '@/utils/metadata/stringify'
import { Trash } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/shadcn/button'
import { SpinnerIcon } from '@/components/ui/outstatic/spinner-icon'
import { toast } from 'sonner'
import { useGetDocuments } from '@/utils/hooks/useGetDocuments'
import { useCollections } from '@/utils/hooks/useCollections'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/shadcn/alert-dialog'
import { useSingletons } from '@/utils/hooks/useSingletons'

type DeleteDocumentButtonProps = {
  slug: string
  extension: MDExtensions
  disabled?: boolean
  onComplete?: () => void
  collection: string
  className?: string
}

export const DeleteDocumentButton = ({
  slug,
  extension,
  disabled = false,
  onComplete = () => { },
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
  const { refetch: refetchCollections } = useCollections({ enabled: false })
  const { refetch: refetchSingletons } = useSingletons({ enabled: false })
  const isSingleton = collection === '_singletons'


  const deleteDocument = async (slug: string) => {
    setDeleting(true)
    try {
      const [{ data }, oid, { data: documents }] = await Promise.all([
        refetchMetadata(),
        fetchOid(),
        isSingleton ? refetchSingletons() : refetchCollections()
      ])

      if (!data) throw new Error('Failed to fetch metadata')
      if (!oid) throw new Error('Failed to fetch oid')
      if (!documents) throw new Error('Failed to fetch schema')
      const { metadata, commitUrl } = data
      const owner = repoOwner || session?.user?.login || ''

      const capi = createCommitApi({
        message: `feat(${collection}): remove ${slug}`,
        owner,
        oid: oid ?? '',
        name: repoSlug,
        branch: repoBranch
      })

      const document = documents.find(
        (col) => col.slug === (isSingleton ? slug : collection)
      )

      const { path } = document ?? {}

      if (!path) throw new Error('Failed to fetch path or directory')

      // remove post markdown file
      capi.removeFile(isSingleton ? path : `${path}/${slug}.${extension}`)

      // For singletons, remove from singletons.json and delete schema.json
      if (isSingleton) {
        const singletonsArray = documents as Array<{ title: string; slug: string; path?: string }>
        const updatedSingletons = singletonsArray.filter((s) => s.slug !== slug)
        capi.replaceFile(
          `${ostContent}/singletons.json`,
          JSON.stringify(updatedSingletons, null, 2) + '\n'
        )

        // Delete the schema.json file
        capi.removeFile(`${ostContent}/_singletons/${slug}.schema.json`)
      }

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
        success: async () => {
          refetchDocuments()
          if (isSingleton) {
            await refetchSingletons()
          }
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
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
