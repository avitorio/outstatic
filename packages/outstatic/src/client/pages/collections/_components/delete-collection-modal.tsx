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
import {
  SchemaType,
  useGetCollectionSchema
} from '@/utils/hooks/useGetCollectionSchema'
import { GetMetadataType, useGetMetadata } from '@/utils/hooks/useGetMetadata'
import useOid from '@/utils/hooks/useOid'
import useOutstatic from '@/utils/hooks/useOutstatic'
import { stringifyMetadata } from '@/utils/metadata/stringify'
import { sentenceCase } from 'change-case'
import { toast } from 'sonner'
import { DetailedReturnType, useCollections } from '@/utils/hooks'

type DeleteCollectionModalProps = {
  setShowDeleteModal: (value: boolean) => void
  setSelectedCollection: (value: string) => void
  collection: string
}

function DeleteCollectionModal({
  setShowDeleteModal,
  setSelectedCollection,
  collection
}: DeleteCollectionModalProps) {
  const { repoOwner, session, repoSlug, repoBranch, ostContent, ostDetach } =
    useOutstatic()
  const [deleting, setDeleting] = useState(false)
  const [keepFiles, setKeepFiles] = useState(false)
  const fetchOid = useOid()

  const { refetch: refetchMetadata } = useGetMetadata({ enabled: false })
  const { refetch: refetchCollections } = useCollections({
    enabled: false,
    detailed: true
  })

  const mutation = useCreateCommit()

  const deleteCollection = async (collection: string) => {
    const [
      { data: metadata, isError: metadataError },
      { data: collections, isError: collectionsError }
    ] = await Promise.all([refetchMetadata(), refetchCollections()])

    if (!metadata || metadataError || !collections || collectionsError) {
      throw new Error('Failed to fetch data')
    }

    try {
      const oid = await fetchOid()
      const owner = repoOwner || session?.user?.login || ''

      const capi = createCommitApi({
        message: `feat(${collection}): remove ${collection}`,
        owner,
        oid: oid ?? '',
        name: repoSlug,
        branch: repoBranch
      })

      let collectionPath = `${ostContent}/${collection}`

      if (collections && collections.fullData) {
        collectionPath = collections.fullData.find(
          (col) => col.name === collection
        )?.path as string

        // remove collection from collections.json
        const newCollections = collections.fullData.filter(
          (collectionInfo) => collectionInfo.name !== collection
        )
        capi.replaceFile(
          `${ostContent}/collections.json`,
          JSON.stringify(newCollections, null, 2)
        )
      }

      if (!keepFiles) {
        capi.removeFile(collectionPath)
      }

      // remove collection from metadata.json
      if (metadata) {
        const m = metadata.metadata
        m.generated = new Date().toISOString()
        m.commit = hashFromUrl(metadata.commitUrl)
        const newMeta = (m.metadata ?? []).filter(
          (post) => post.collection !== collection
        )
        capi.replaceFile(
          `${ostContent}/metadata.json`,
          stringifyMetadata({ ...m, metadata: newMeta })
        )
      }

      const input = capi.createInput()

      toast.promise(mutation.mutateAsync(input), {
        loading: 'Deleting collection...',
        success: () => {
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
          setSelectedCollection('')
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
          {ostDetach ? (
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
                  {sentenceCase(collection)}
                </span>{' '}
                from the Outstatic&nbsp;Dashboard.
              </Label>
            </div>
          ) : null}
          <p className="text-sm text-muted-foreground">
            This action cannot be undone.
          </p>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setShowDeleteModal(false)
              setSelectedCollection('')
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
