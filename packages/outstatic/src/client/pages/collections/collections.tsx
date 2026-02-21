import { AdminLayout } from '@/components/admin-layout'
import { AdminLoading } from '@/components/admin-loading'
import { Button } from '@/components/ui/shadcn/button'
import { CollectionType, useCollections } from '@/utils/hooks/useCollections'
import { Card, CardContent } from '@/components/ui/shadcn/card'
import Link from 'next/link'
import { useState } from 'react'
import DeleteCollectionModal from './_components/delete-collection-modal'
import { useOutstatic } from '@/utils/hooks/useOutstatic'
import { Settings, Trash } from 'lucide-react'
import CollectionOnboarding from './_components/collection-onboarding'
import LineBackground from '@/components/ui/outstatic/line-background'
import NewCollectionModal from './_components/new-collection-modal'

export default function Collections() {
  const { data: collections, isPending } = useCollections()
  const { dashboardRoute, session } = useOutstatic()

  const [selectedCollection, setSelectedCollection] =
    useState<CollectionType | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showNewCollectionModal, setShowNewCollectionModal] = useState(false)

  if (isPending) return <AdminLoading />

  return (
    <AdminLayout title="Collections">
      {!collections || collections.length === 0 ? (
        <LineBackground>
          <div className="mb-8 flex h-12 items-center">
            <h1 className="mr-12 text-2xl text-foreground">Collections</h1>
            <Button size="sm" onClick={() => setShowNewCollectionModal(true)}>
              New Collection
            </Button>
          </div>
          <CollectionOnboarding />
        </LineBackground>
      ) : (
        <>
          <div className="mb-8 flex h-12 items-center">
            <h1 className="mr-12 text-2xl text-foreground">Collections</h1>
            {session?.user?.permissions?.includes('collections.manage') ? (
              <Button size="sm" onClick={() => setShowNewCollectionModal(true)}>
                New Collection
              </Button>
            ) : null}
          </div>
          <div className="w-full grid md:grid-cols-3 2xl:grid-cols-4 gap-6 mb-12">
            {collections &&
              collections.map((collection) => (
                <Card
                  key={collection.slug}
                  className="hover:border-gray-500 transition-all duration-300"
                >
                  <CardContent className="relative flex justify-between items-center">
                    <Link href={`${dashboardRoute}/${collection.slug}`}>
                      <h5 className="text-2xl cursor-pointer font-bold tracking-tight text-foreground">
                        {collection.title}
                        <span className="absolute top-0 bottom-0 left-0 right-16"></span>
                      </h5>
                    </Link>
                    {session?.user?.permissions?.includes(
                      'collections.manage'
                    ) ? (
                      <div className="z-10 flex gap-2">
                        <Button asChild size="icon" variant="ghost">
                          <Link
                            href={`${dashboardRoute}/collections/${collection.slug}`}
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
                    ) : null}
                  </CardContent>
                </Card>
              ))}
          </div>
        </>
      )}

      {showDeleteModal && selectedCollection ? (
        <DeleteCollectionModal
          setShowDeleteModal={setShowDeleteModal}
          setSelectedCollection={setSelectedCollection}
          collection={selectedCollection}
        />
      ) : null}
      {showNewCollectionModal && (
        <NewCollectionModal
          open={showNewCollectionModal}
          onOpenChange={setShowNewCollectionModal}
        />
      )}
    </AdminLayout>
  )
}
