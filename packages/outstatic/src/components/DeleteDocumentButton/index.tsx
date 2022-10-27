import { useContext, useState } from 'react'
import { OutstaticContext } from '../../context'
import { useCreateCommitMutation } from '../../graphql/generated'
import { useOstSession } from '../../utils/auth/hooks'
import { createCommitInput } from '../../utils/createCommitInput'
import useOid from '../../utils/useOid'
import Modal from '../Modal'

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
    useContext(OutstaticContext)
  const fetchOid = useOid()

  const deleteDocument = async (slug: string) => {
    setDeleting(true)
    try {
      const oid = await fetchOid()
      const owner = repoOwner || session?.user?.login || ''

      const commitInput = createCommitInput({
        owner,
        oldSlug: slug,
        oid,
        repoSlug,
        repoBranch,
        contentPath,
        monorepoPath,
        collection
      })

      await createCommit({ variables: commitInput })
      setShowDeleteModal(false)
      if (onComplete) onComplete()
    } catch (error) {}
  }

  return (
    <>
      <button
        onClick={() => setShowDeleteModal(true)}
        type="button"
        disabled={disabled}
        className={`z-10 inline-block text-gray-500 hover:bg-white focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg text-sm p-1.5 ${className}`}
        title="Delete document"
      >
        <span className="sr-only">Delete document</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="24"
          height="24"
        >
          <path fill="none" d="M0 0h24v24H0z" />
          <path d="M17 6h5v2h-2v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8H2V6h5V3a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v3zm1 2H6v12h12V8zm-9 3h2v6H9v-6zm4 0h2v6h-2v-6zM9 4v2h6V4H9z" />
        </svg>
      </button>
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
            <button
              type="button"
              className="flex rounded-lg bg-red-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-red-800 focus:outline-none"
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
            </button>
            <button
              type="button"
              className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium focus:z-10 focus:outline-none focus:ring-4 order-gray-600 bg-gray-800 text-white hover:border-gray-600 hover:bg-gray-700 focus:ring-gray-700"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}

export default DeleteDocumentButton
