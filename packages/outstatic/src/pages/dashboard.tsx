import Link from 'next/link'
import { useContext, useState } from 'react'
import { AdminLayout } from '../components'
import Modal from '../components/Modal'
import { OutstaticContext } from '../context'
import { useCreateCommitMutation } from '../graphql/generated'
import { contentTypeCommitInput } from '../utils/contentTypeCommitInput'
import useOid from '../utils/useOid'

export default function Dashboard() {
  const {
    contentTypes,
    session,
    repoSlug,
    contentPath,
    monorepoPath,
    removePage
  } = useContext(OutstaticContext)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedContentType, setSelectedContentType] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [createCommit] = useCreateCommitMutation()
  const fetchOid = useOid()

  const deletePost = async (contentType: string) => {
    try {
      const oid = await fetchOid()
      const owner = session?.user?.login || ''

      const commitInput = contentTypeCommitInput({
        owner,
        oid,
        repoSlug,
        remove: true,
        contentPath,
        monorepoPath,
        contentType
      })

      await createCommit({ variables: commitInput })
      setShowDeleteModal(false)
      removePage(contentType)
    } catch (error) {}
  }

  return (
    <AdminLayout>
      {contentTypes.length === 0 ? (
        <div className="max-w-2xl prose prose-base">
          <h1>Welcome to Outstatic!</h1>
          <p>To get started you will need to create a new Content Type.</p>
          <p>
            Content Types are the building blocks of your Outstatic website.
            <br />
            Create your first Content Type by clicking the button below.
          </p>

          <Link href="/outstatic/content-types/new">
            <a className="rounded-lg border px-5 py-2.5 text-sm font-medium focus:outline-none focus:ring-4 border-gray-600 bg-gray-800 text-white hover:border-gray-600 hover:bg-gray-700 focus:ring-gray-700 no-underline">
              New Content Type
            </a>
          </Link>
          <p>
            To learn more about how Content Types work{' '}
            <a
              href="https://outstatic.com/docs/content-types"
              target="_blank"
              rel="noreferrer"
            >
              click here
            </a>
            .
          </p>
        </div>
      ) : (
        <>
          <div className="mb-8 flex h-12 items-center">
            <h1 className="mr-12 text-2xl">Dashboard</h1>
            <Link href="/outstatic/content-types/new">
              <a className="rounded-lg border px-5 py-2.5 text-sm font-medium focus:outline-none focus:ring-4 border-gray-600 bg-gray-800 text-white hover:border-gray-600 hover:bg-gray-700 focus:ring-gray-700">
                New Content Type
              </a>
            </Link>
          </div>
          <div className="max-w-5xl w-full grid grid-cols-3 gap-6">
            {contentTypes.map((contentType) => (
              <div
                key={contentType}
                className="relative flex p-6 justify-between items-center max-w-sm bg-white rounded-lg border border-gray-200 shadow-md hover:bg-slate-100"
              >
                <Link href={`/outstatic/${contentType}`}>
                  <h5 className="text-2xl cursor-pointer font-bold tracking-tight text-gray-900 capitalize">
                    {contentType}
                    <span className="absolute top-0 bottom-0 left-0 right-16"></span>
                  </h5>
                </Link>
                <button
                  className="z-10 inline-block text-gray-500 hover:bg-white focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg text-sm p-1.5"
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(true)
                    setSelectedContentType(contentType)
                  }}
                >
                  <span className="sr-only">Delete content</span>
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
              </div>
            ))}
          </div>
        </>
      )}
      {showDeleteModal && (
        <Modal
          title="Delete Content Type"
          close={() => {
            setShowDeleteModal(false)
            setSelectedContentType('')
          }}
        >
          <div className="space-y-6 p-6 text-left">
            <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
              Are you sure you want to delete this content type?
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
                deletePost(selectedContentType)
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
              onClick={() => {
                setShowDeleteModal(false)
                setSelectedContentType('')
              }}
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </AdminLayout>
  )
}
