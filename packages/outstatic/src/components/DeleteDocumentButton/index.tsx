import Modal from '@/components/Modal'
import { useCreateCommitMutation, useDocumentQuery } from '@/graphql/generated'
import { useOstSession } from '@/utils/auth/hooks'
import { createCommitApi } from '@/utils/createCommitApi'
import { hashFromUrl } from '@/utils/hashFromUrl'
import useOid from '@/utils/hooks/useOid'
import useOutstatic from '@/utils/hooks/useOutstatic'
import { stringifyMetadata } from '@/utils/metadata/stringify'
import { MetadataSchema } from '@/utils/metadata/types'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../ui/button'

type DeleteDocumentButtonProps = {
  slug: string
  disabled?: boolean
  onComplete?: () => void
  collection: string
  className?: string
}

const DeleteDocumentButton = ({
  slug,
  disabled = false,
  onComplete = () => {},
  collection,
  className
}: DeleteDocumentButtonProps) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { session } = useOstSession()
  const [createCommit] = useCreateCommitMutation()
  const { repoOwner, repoSlug, repoBranch, contentPath, monorepoPath } =
    useOutstatic()
  const fetchOid = useOid()

  const { data: metadata } = useDocumentQuery({
    variables: {
      owner: repoOwner || session?.user?.login || '',
      name: repoSlug,
      filePath: `${repoBranch}:${
        monorepoPath ? monorepoPath + '/' : ''
      }${contentPath}/metadata.json`
    },
    fetchPolicy: 'network-only'
  })

  const deleteDocument = async (slug: string) => {
    setDeleting(true)
    try {
      const oid = await fetchOid()
      const owner = repoOwner || session?.user?.login || ''

      const capi = createCommitApi({
        message: `feat(${collection}): remove ${slug}`,
        owner,
        oid: oid ?? '',
        name: repoSlug,
        branch: repoBranch
      })

      // remove post markdown file
      capi.removeFile(
        `${
          monorepoPath ? monorepoPath + '/' : ''
        }${contentPath}/${collection}/${slug}.md`
      )

      // remove post from metadata.json
      if (metadata?.repository?.object?.__typename === 'Blob') {
        const m = JSON.parse(
          metadata.repository.object.text ?? '{}'
        ) as MetadataSchema
        m.generated = new Date().toISOString()
        m.commit = hashFromUrl(metadata.repository.object.commitUrl)
        const newMeta = (m.metadata ?? []).filter((post) => post.slug !== slug)
        capi.replaceFile(
          `${
            monorepoPath ? monorepoPath + '/' : ''
          }${contentPath}/metadata.json`,
          stringifyMetadata({ ...m, metadata: newMeta })
        )
      }

      const input = capi.createInput()

      await createCommit({ variables: { input } })
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
        <Trash2 className="stroke-foreground" />
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
          <div className="flex items-center space-x-2 rounded-b border-t p-6">
            <Button
              variant="destructive"
              onClick={() => {
                deleteDocument(slug)
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
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
          </div>
        </Modal>
      )}
    </>
  )
}

export default DeleteDocumentButton
