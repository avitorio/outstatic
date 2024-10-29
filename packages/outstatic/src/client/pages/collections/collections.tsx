import { AdminLayout } from '@/components'
import { AdminLoading } from '@/components/AdminLoading'
import { Button } from '@/components/ui/shadcn/button'
import { useCollections } from '@/utils/hooks/useCollections'
import { Card, CardContent } from '@/components/ui/shadcn/card'
import Link from 'next/link'
import { useState } from 'react'
import DeleteCollectionModal from './_components/delete-collection-modal'
import useOutstatic from '@/utils/hooks/useOutstatic'
import { Settings, Trash } from 'lucide-react'
import { capitalCase } from 'change-case'
import CollectionOnboarding from './_components/collection-onboarding'
import LineBackground from '@/components/ui/outstatic/line-background'

export default function Collections() {
  const { data: collections, isPending } = useCollections()
  const { dashboardRoute } = useOutstatic()

  const [selectedCollection, setSelectedCollection] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  if (isPending) return <AdminLoading />

  return (
    <AdminLayout title="Collections">
      {!collections || collections.length === 0 ? (
        <LineBackground>
          <CollectionOnboarding />
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
                      {capitalCase(collection)}
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
