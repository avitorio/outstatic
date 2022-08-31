import { useContext, useState } from 'react'
import { OutstaticContext } from '../../context'
import { useCreateCommitMutation } from '../../graphql/generated'
import { useOstSession } from '../../utils/auth/hooks'
import { createCommitInput } from '../../utils/createCommitInput'
import useOid from '../../utils/useOid'
import Modal from '../Modal'

type DeletePostButtonProps = {
  slug: string
  disabled?: boolean
  onComplete?: () => void
  contentType: string
}

const DeletePostButton = ({
  slug,
  disabled = false,
  onComplete = () => {},
  contentType
}: DeletePostButtonProps) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { session } = useOstSession()
  const [createCommit] = useCreateCommitMutation()
  const { repoSlug, contentPath, monorepoPath } = useContext(OutstaticContext)
  const fetchOid = useOid()

  const deletePost = async (slug: string) => {
    try {
      const oid = await fetchOid()
      const owner = session?.user?.name || ''

      const commitInput = createCommitInput({
        owner,
        oldSlug: slug,
        oid,
        repoSlug,
        contentPath: contentPath + '/' + contentType,
        monorepoPath
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
        className="mr-2 mb-2 rounded-lg border border-red-700 bg-red-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-red-800 focus:outline-none"
      >
        Delete
      </button>
      {showDeleteModal && (
        <Modal title="Delete Post" close={() => setShowDeleteModal(false)}>
          <div className="space-y-6 p-6 text-left">
            <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
              Are you sure you want to delete this post?
            </p>
            <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
              This action cannot be undone.
            </p>
          </div>

          <div className="flex items-center space-x-2 rounded-b border-t border-gray-200 p-6 dark:border-gray-600">
            <button
              type="button"
              className="flex rounded-lg bg-red-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-red-800 focus:outline-none"
              onClick={() => {
                setDeleting(true)
                deletePost(slug)
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
              className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:z-10 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:border-gray-500 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white dark:focus:ring-gray-600"
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

export default DeletePostButton
