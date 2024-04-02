import { AdminLayout } from '@/components'
import Modal from '@/components/Modal'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  useCollectionsQuery,
  useCreateCommitMutation,
  useDocumentLazyQuery
} from '@/graphql/generated'
import { createCommitApi } from '@/utils/createCommitApi'
import { hashFromUrl } from '@/utils/hashFromUrl'
import useOid from '@/utils/hooks/useOid'
import useOutstatic from '@/utils/hooks/useOutstatic'
import { stringifyMetadata } from '@/utils/metadata/stringify'
import { MetadataSchema } from '@/utils/metadata/types'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Collections() {
  const {
    repoOwner,
    session,
    repoSlug,
    collections,
    repoBranch,
    contentPath,
    monorepoPath,
    removePage
  } = useOutstatic()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedCollection, setSelectedCollection] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [createCommit] = useCreateCommitMutation()
  const fetchOid = useOid()

  const [loadMetadata] = useDocumentLazyQuery({
    variables: {
      owner: repoOwner || session?.user?.login || '',
      name: repoSlug,
      filePath: `${repoBranch}:${
        monorepoPath ? monorepoPath + '/' : ''
      }${contentPath}/metadata.json`
    },
    fetchPolicy: 'network-only'
  })

  const deleteCollection = async (collection: string) => {
    loadMetadata().then(async ({ data: metadata }) => {
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

        capi.removeFile(
          `${
            monorepoPath ? monorepoPath + '/' : ''
          }${contentPath}/${collection}`
        )

        // remove collection from metadata.json
        if (metadata?.repository?.object?.__typename === 'Blob') {
          const m = JSON.parse(
            metadata.repository.object.text ?? '{}'
          ) as MetadataSchema
          m.generated = new Date().toISOString()
          m.commit = hashFromUrl(metadata.repository.object.commitUrl)
          const newMeta = (m.metadata ?? []).filter(
            (post) => post.collection !== collection
          )
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
        setDeleting(false)
        removePage(collection)
      } catch (error) {}
    })
  }

  return (
    <AdminLayout title="Collections">
      {collections.length === 0 ? (
        <div className="max-w-2xl">
          <div className="absolute bottom-0 left-0 md:left-64 right-0 md:top-36">
            <svg
              fill="none"
              className="h-full w-full"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="m1555.43 194.147c-100.14 46.518-204.72 78.763-313.64 96.841-78.16 12.972-282.29 0-291.79-143.988-1.58-23.948 1-89.4705 67-127 58-32.9805 115.15-13.36095 142.5 5.5 27.35 18.861 45.02 44.5 54 73 16.37 51.951-9.22 115.124-30.65 161.874-57.09 124.562-177.31 219.357-311.976 246.789-142.617 29.052-292.036-9.369-430.683-41.444-100.166-23.173-196.003-36.724-298.229-15.203-48.046 10.115-94.9295 24.91-139.962 44.112"
                className="stroke-slate-900"
                strokeWidth="2"
              />
            </svg>
          </div>
          <div className="relative">
            <div className="mb-8 flex h-12 items-center">
              <h1 className="mr-12 text-2xl">Welcome to Outstatic!</h1>
            </div>
            <div className="mb-20 max-w-2xl p-8 px-4 md:p-8 text-black bg-white rounded-lg border border-gray-200 shadow-md prose prose-base">
              <p>
                To get started you will need to create a new Collection.
                Collections are the main building block of your Outstatic
                website.
              </p>
              <p>Create your first Collection by clicking the button below.</p>

              <Link href="/outstatic/collections/new">
                <div className="inline-block rounded-lg border px-5 py-2.5 text-sm font-medium focus:outline-none focus:ring-4 border-gray-600 bg-gray-800 text-white hover:border-gray-600 hover:bg-gray-700 focus:ring-gray-700 no-underline">
                  New Collection
                </div>
              </Link>
              <p>
                To learn more about how Collections work{' '}
                <a
                  href="https://outstatic.com/docs/introduction#what-are-collections"
                  target="_blank"
                  rel="noreferrer"
                >
                  click here
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-8 flex h-12 items-center">
            <h1 className="mr-12 text-2xl">Collections</h1>
            <Button asChild>
              <Link href="/outstatic/collections/new">New Collection</Link>
            </Button>
          </div>
          <div className="max-w-5xl w-full grid md:grid-cols-3 gap-6">
            {collections.map((collection) => (
              <Card key={collection}>
                <CardContent className="relative flex p-6 justify-between items-center">
                  <Link
                    href={`/outstatic/${collection}`}
                    className="focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg"
                  >
                    <h5 className="text-2xl cursor-pointer font-bold tracking-tight text-gray-900 capitalize hover:text-blue-500">
                      {collection}
                      <span className="absolute top-0 bottom-0 left-0 right-16"></span>
                    </h5>
                  </Link>
                  <div className="z-10 flex gap-2">
                    <Button asChild size="icon" variant="ghost">
                      <Link href={`/outstatic/collections/${collection}`}>
                        <span className="sr-only">Edit collection</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          width="24"
                          height="24"
                        >
                          <path fill="none" d="M0 0h24v24H0z" />
                          <path d="M15.7279 9.57629L14.3137 8.16207L5 17.4758V18.89H6.41421L15.7279 9.57629ZM17.1421 8.16207L18.5563 6.74786L17.1421 5.33365L15.7279 6.74786L17.1421 8.16207ZM7.24264 20.89H3V16.6474L16.435 3.21233C16.8256 2.8218 17.4587 2.8218 17.8492 3.21233L20.6777 6.04075C21.0682 6.43128 21.0682 7.06444 20.6777 7.45497L7.24264 20.89Z"></path>
                        </svg>
                      </Link>
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      type="button"
                      onClick={() => {
                        setShowDeleteModal(true)
                        setSelectedCollection(collection)
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
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
      {showDeleteModal && (
        <Modal
          title="Delete Collection"
          close={() => {
            setShowDeleteModal(false)
            setSelectedCollection('')
          }}
        >
          <div className="space-y-6 p-6 text-left">
            <p className="text-base leading-relaxed text-gray-500">
              Are you sure you want to delete this collection?
            </p>
            <p className="text-base leading-relaxed text-gray-500">
              This action cannot be undone.
            </p>
          </div>

          <div className="flex items-center space-x-2 rounded-b border-t p-6">
            <Button
              variant="destructive"
              onClick={() => {
                setDeleting(true)
                deleteCollection(selectedCollection)
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
      )}
    </AdminLayout>
  )
}
