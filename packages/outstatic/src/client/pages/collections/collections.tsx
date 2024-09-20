import { AdminLayout } from '@/components'
import { AdminLoading } from '@/components/AdminLoading'
import { Button } from '@/components/ui/shadcn/button'
import { useCollections } from '@/utils/hooks/useCollections'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/shadcn/card'
import Link from 'next/link'
import { useState } from 'react'
import DeleteCollectionModal from './components/delete-collection-modal'
import useOutstatic from '@/utils/hooks/useOutstatic'
import LineBackground from '@/components/ui/outstatic/line-background'
import GitHubBranchSearch from '@/components/GitHubBranchSearch'

export default function Collections() {
  const { data: collections, isPending } = useCollections()
  const { dashboardRoute } = useOutstatic()
  const [confirmBranch, setConfirmBranch] = useState(false)
  const [selectedCollection, setSelectedCollection] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  if (isPending) return <AdminLoading />

  return (
    <AdminLayout title="Collections">
      {!collections ? (
        <LineBackground>
          <div className="relative">
            <div className="mb-8 flex h-12 items-center">
              <h1 className="mr-12 text-2xl">Welcome to Outstatic!</h1>
            </div>
            <div className="max-w-2xl">
              <Card>
                {confirmBranch ? (
                  <>
                    <CardHeader>
                      <CardTitle>Create Collection</CardTitle>
                      <CardDescription>
                        Get started with your first Collection
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="prose prose-base">
                      <p>
                        To get started you will need to create a new Collection.
                        Collections are the main building block of your
                        Outstatic website.
                      </p>
                      <p>
                        Create your first Collection by clicking the button
                        below.
                      </p>
                      <Button asChild>
                        <Link
                          href="/outstatic/collections/new"
                          className="no-underline"
                        >
                          New Collection
                        </Link>
                      </Button>
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
                    </CardContent>
                  </>
                ) : (
                  <>
                    <CardHeader>
                      <CardTitle>Confirm Branch</CardTitle>
                      <CardDescription>
                        Confirm the branch before creating your first Collection
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="prose prose-base">
                      <p>
                        All content in Outstatic is saved to GitHub. If this is
                        your first time using Outstatic, we recommend creating a
                        new branch to experiment with.
                      </p>
                      <p>
                        This allows you to safely make changes and test features
                        without affecting active branches. You can always select
                        a different branch later.
                      </p>
                      <div className="flex gap-3">
                        <GitHubBranchSearch />
                        <Button onClick={() => setConfirmBranch(true)}>
                          Confirm Branch
                        </Button>
                      </div>
                    </CardContent>
                  </>
                )}
              </Card>
            </div>
          </div>
        </LineBackground>
      ) : (
        <>
          <div className="mb-8 flex h-12 items-center">
            <h1 className="mr-12 text-2xl">Collections</h1>
            <Button asChild>
              <Link href={`${dashboardRoute}/collections/new`}>
                New Collection
              </Link>
            </Button>
          </div>
          <div className="max-w-5xl w-full grid md:grid-cols-3 gap-6">
            {collections.map((collection) => (
              <Card key={collection}>
                <CardContent className="relative flex p-6 justify-between items-center">
                  <Link
                    href={`${dashboardRoute}/${collection}`}
                    className="focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg"
                  >
                    <h5 className="text-2xl cursor-pointer font-bold tracking-tight text-gray-900 capitalize hover:text-blue-500">
                      {collection}
                      <span className="absolute top-0 bottom-0 left-0 right-16"></span>
                    </h5>
                  </Link>
                  <div className="z-10 flex gap-2">
                    <Button asChild size="icon" variant="ghost">
                      <Link
                        href={`${dashboardRoute}/collections/${collection}`}
                      >
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
        <DeleteCollectionModal
          setShowDeleteModal={setShowDeleteModal}
          setSelectedCollection={setSelectedCollection}
          collection={selectedCollection}
        />
      )}
    </AdminLayout>
  )
}
