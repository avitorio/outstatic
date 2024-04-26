import Modal from '@/components/Modal'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Label } from '@radix-ui/react-label'
import { useState } from 'react'

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

  const { refetch: refetchSchema } = useGetCollectionSchema({
    collection,
    enabled: false
  })

  const mutation = useCreateCommit()

  const deleteCollection = async (collection: string) => {
    const refetchArray = [refetchMetadata] as any[]
    if (!keepFiles) refetchArray.push(refetchSchema)
    const refetched = await Promise.all(
      refetchArray.map((refetch) => refetch())
    )

    const metadata = refetched[0]?.data as GetMetadataType
    const schema = refetched[1]?.data as SchemaType

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

      const collectionPath = `${ostContent}/${collection}`

      if (schema?.path && schema.path !== collectionPath) {
        capi.removeFile(schema.path)
      }

      capi.removeFile(collectionPath)

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

      mutation.mutate(input, {
        onSuccess: () => {
          setDeleting(false)
          setShowDeleteModal(false)
        }
      })
    } catch (error) {}
  }

  return (
    <Modal
      title="Delete Collection"
      close={() => {
        setShowDeleteModal(false)
        setSelectedCollection('')
      }}
    >
      <div className="space-y-6 p-6 text-left">
        <p className="text-base leading-relaxed">
          Are you sure you want to delete this collection?
        </p>

        {ostDetach ? (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="detached-delete"
              checked={keepFiles}
              onCheckedChange={() => setKeepFiles(!keepFiles)}
            />
            <Label htmlFor="detached-delete">
              Remove{' '}
              <div className="inline-block font-bold first-letter:uppercase">
                {collection}
              </div>{' '}
              from Outstatic but keep files in the repository.
            </Label>
          </div>
        ) : null}
        <p className="text-base leading-relaxed">
          This action cannot be undone.
        </p>
      </div>

      <div className="flex items-center space-x-2 rounded-b border-t p-6">
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
        <Button
          variant="outline"
          onClick={() => {
            setShowDeleteModal(false)
            setSelectedCollection('')
          }}
        >
          Cancel
        </Button>
      </div>
    </Modal>
  )
}

export default DeleteCollectionModal
