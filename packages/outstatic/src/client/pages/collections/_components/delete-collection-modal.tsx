import { Button } from '@/components/ui/shadcn/button'
import { Checkbox } from '@/components/ui/shadcn/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/shadcn/dialog'
import { Label } from '@/components/ui/shadcn/label'
import { useState } from 'react'
import { createCommitApi } from '@/utils/createCommitApi'
import { hashFromUrl } from '@/utils/hashFromUrl'
import { useCreateCommit } from '@/utils/hooks/useCreateCommit'
import { useGetMetadata } from '@/utils/hooks/useGetMetadata'
import useOid from '@/utils/hooks/useOid'
import useOutstatic from '@/utils/hooks/useOutstatic'
import { stringifyMetadata } from '@/utils/metadata/stringify'
import { toast } from 'sonner'
import { CollectionType, useCollections } from '@/utils/hooks/useCollections'

type DeleteCollectionModalProps = {
  setShowDeleteModal: (value: boolean) => void
  setSelectedCollection: (value: CollectionType | null) => void
  collection: CollectionType
}

function DeleteCollectionModal({
  setShowDeleteModal,
  setSelectedCollection,
  collection
}: DeleteCollectionModalProps) {
  const { repoOwner, session, repoSlug, repoBranch, ostContent } =
    useOutstatic()
  const [deleting, setDeleting] = useState(false)
  const [keepFiles, setKeepFiles] = useState(false)
  const fetchOid = useOid()

  const { refetch: refetchMetadata } = useGetMetadata({ enabled: false })
  const { refetch: refetchCollections } = useCollections({
    enabled: false
  })

  const mutation = useCreateCommit()

  const deleteCollection = async (collection: CollectionType) => {
    const [
      { data: metadata, isError: metadataError },
      { data: collections, isError: collectionsError }
    ] = await Promise.all([refetchMetadata(), refetchCollections()])

    if (metadataError || !collections || collectionsError) {
      throw new Error('Failed to fetch data')
    }

    try {
      const oid = await fetchOid()
      const owner = repoOwner || session?.user?.login || ''

      const capi = createCommitApi({
        message: `feat(${collection.slug}): remove ${collection.slug}`,
        owner,
        oid: oid ?? '',
        name: repoSlug,
        branch: repoBranch
      })

      if (collections) {
        // remove collection from collections.json
        const newCollections = collections.filter(
          (collectionInfo) => collectionInfo.slug !== collection.slug
        )
        capi.replaceFile(
          `${ostContent}/collections.json`,
          JSON.stringify(newCollections, null, 2)
        )
      }

      if (!keepFiles) {
        capi.removeFile(collection.path)
      }

      // remove collection from metadata.json
      if (metadata) {
        const m = metadata.metadata
        m.generated = new Date().toISOString()
        m.commit = hashFromUrl(metadata.commitUrl)
        const newMeta = (m.metadata ?? []).filter(
          (post) => post.collection !== collection.slug
        )
        capi.replaceFile(
          `${ostContent}/metadata.json`,
          stringifyMetadata({ ...m, metadata: newMeta })
        )
      }

      const input = capi.createInput()

      toast.promise(mutation.mutateAsync(input), {
        loading: 'Deleting collection...',
        success: async () => {
          await refetchCollections()
          setDeleting(false)
          setShowDeleteModal(false)
          return 'Collection deleted successfully'
        },
        error: 'Failed to delete collection'
      })
    } catch (error) {}
  }

  return (
    <Dialog
      open={true}
      onOpenChange={(open) => {
        if (!open) {
          setShowDeleteModal(false)
          setSelectedCollection(null)
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Collection</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this collection?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="detached-delete"
              checked={keepFiles}
              onCheckedChange={() => setKeepFiles(!keepFiles)}
              className="mt-0.5"
            />
            <Label htmlFor="detached-delete" className="leading-normal">
              Keep files in the repository. Only remove{' '}
              <span className="inline-block font-bold first-letter:uppercase">
                {collection.title}
              </span>{' '}
              from the Outstatic&nbsp;Dashboard.
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setShowDeleteModal(false)
              setSelectedCollection(null)
            }}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              setDeleting(true)
              deleteCollection(collection)
            }}
          >
            {deleting ? (
              <>
                <svg
                  className="mr-3 -ml-1 h-5 w-5 animate-spin text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Deleting
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DeleteCollectionModal
