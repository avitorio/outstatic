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
import { useEffect, useMemo, useState } from 'react'
import { createCommitApi } from '@/utils/create-commit-api'
import { createOutstaticCommitMessage } from '@/utils/commit-message'
import { hashFromUrl } from '@/utils/hash-from-url'
import { useCreateCommit } from '@/utils/hooks/use-create-commit'
import { useGetMetadata } from '@/utils/hooks/use-get-metadata'
import useOid from '@/utils/hooks/use-oid'
import { usePermissions } from '@/utils/hooks/use-permissions'
import { useOutstatic } from '@/utils/hooks/use-outstatic'
import { stringifyMetadata } from '@/utils/metadata/stringify'
import { toast } from 'sonner'
import { CollectionType, useCollections } from '@/utils/hooks/use-collections'
import {
  getCollectionsAfterDeletion,
  getDescendantCollectionSlugs,
  getMetadataAfterCollectionDeletion
} from '@/utils/collections/collection-tree'

type DeleteCollectionModalProps = {
  setShowDeleteModal: (value: boolean) => void
  setSelectedCollection?: (value: CollectionType | null) => void
  collection: CollectionType
}

function DeleteCollectionModal({
  setShowDeleteModal,
  setSelectedCollection,
  collection
}: DeleteCollectionModalProps) {
  const { repoOwner, session, repoSlug, repoBranch, ostContent } =
    useOutstatic()
  const { canManageCollections } = usePermissions()
  const [deleting, setDeleting] = useState(false)
  const [keepFiles, setKeepFiles] = useState(true)
  const [deleteChildren, setDeleteChildren] = useState(false)
  const fetchOid = useOid()

  const { refetch: refetchMetadata } = useGetMetadata({ enabled: false })
  const { data: collectionsData, refetch: refetchCollections } =
    useCollections()

  const mutation = useCreateCommit()
  const descendantSlugs = useMemo(() => {
    if (!collectionsData) {
      return new Set<string>()
    }

    return getDescendantCollectionSlugs(collectionsData, collection.slug)
  }, [collection.slug, collectionsData])
  const hasChildCollections = descendantSlugs.size > 0

  useEffect(() => {
    if (!canManageCollections) {
      setShowDeleteModal(false)
      setSelectedCollection?.(null)
    }
  }, [canManageCollections, setSelectedCollection, setShowDeleteModal])

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
        message: createOutstaticCommitMessage({
          scope: 'config',
          action: 'delete',
          target: 'collection',
          label: collection.slug
        }),
        owner,
        oid: oid ?? '',
        name: repoSlug,
        branch: repoBranch
      })

      const latestCollection =
        collections.find(
          (collectionInfo) => collectionInfo.slug === collection.slug
        ) ?? collection
      const latestDescendantSlugs = getDescendantCollectionSlugs(
        collections,
        collection.slug
      )
      const shouldDeleteChildren =
        deleteChildren && latestDescendantSlugs.size > 0
      const deletedCollections = collections.filter(
        (collectionInfo) =>
          collectionInfo.slug === collection.slug ||
          (shouldDeleteChildren &&
            latestDescendantSlugs.has(collectionInfo.slug))
      )

      if (
        !deletedCollections.some(
          (deletedCollection) =>
            deletedCollection.slug === latestCollection.slug
        )
      ) {
        deletedCollections.push(latestCollection)
      }

      const newCollections = getCollectionsAfterDeletion(
        collections,
        latestCollection,
        shouldDeleteChildren
      )
      capi.replaceFile(
        `${ostContent}/collections.json`,
        JSON.stringify(newCollections, null, 2)
      )

      if (!keepFiles) {
        deletedCollections.forEach((deletedCollection) => {
          capi.removeFile(deletedCollection.path)
        })
      }

      // remove collection from metadata.json
      if (metadata) {
        const m = metadata.metadata
        m.generated = new Date().toISOString()
        m.commit = hashFromUrl(metadata.commitUrl)
        const newMeta = getMetadataAfterCollectionDeletion(
          m.metadata ?? [],
          collection.slug,
          latestDescendantSlugs,
          shouldDeleteChildren
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

  if (!canManageCollections) {
    return null
  }

  return (
    <Dialog
      open={true}
      onOpenChange={(open) => {
        if (!open) {
          setShowDeleteModal(false)
          setSelectedCollection?.(null)
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
          {hasChildCollections ? (
            <div className="flex items-start space-x-2">
              <Checkbox
                id="delete-child-collections"
                checked={deleteChildren}
                onCheckedChange={() => setDeleteChildren(!deleteChildren)}
                className="mt-0.5"
              />
              <Label
                htmlFor="delete-child-collections"
                className="leading-normal"
              >
                <div>
                  Also delete child collections. When unchecked, child
                  collections move up one level.
                </div>
              </Label>
            </div>
          ) : null}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="detached-delete"
              checked={keepFiles}
              onCheckedChange={() => setKeepFiles(!keepFiles)}
              className="mt-0.5"
            />
            <Label htmlFor="detached-delete" className="leading-normal ">
              <div>
                Keep files in the repository. Only remove the selected
                collection{deleteChildren ? 's' : ''} from the
                Outstatic&nbsp;Dashboard.
              </div>
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setShowDeleteModal(false)
              setSelectedCollection?.(null)
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
