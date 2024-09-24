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
import { GitHubBranchSearch } from '@/components/ui/outstatic/github-branch-search'
import { Settings, Trash } from 'lucide-react'

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
                      <CardTitle>Create a Collection</CardTitle>
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
                          href={`${dashboardRoute}/collections/new`}
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
                        <Settings className="w-6 h-6" />
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
                      <Trash className="w-6 h-6" />
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
