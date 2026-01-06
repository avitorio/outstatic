import { AdminLayout } from '@/components/admin-layout'
import { AdminLoading } from '@/components/admin-loading'
import { Button } from '@/components/ui/shadcn/button'
import { useCollections } from '@/utils/hooks/useCollections'
import { useSingletons } from '@/utils/hooks/useSingletons'
import { Card, CardContent } from '@/components/ui/shadcn/card'
import Link from 'next/link'
import { useOutstatic } from '@/utils/hooks/useOutstatic'
import { Settings, Plus, FileText } from 'lucide-react'
import CollectionOnboarding from '../collections/_components/collection-onboarding'
import LineBackground from '@/components/ui/outstatic/line-background'
import { singular } from 'pluralize'
import SingletonOnboarding from '../singletons/_components/singleton-onboarding'

export default function Dashboard() {
  const { data: collections, isPending: collectionsPending } = useCollections()
  const { data: singletons, isPending: singletonsPending } = useSingletons()
  const { dashboardRoute } = useOutstatic()

  const isPending = collectionsPending || singletonsPending
  const hasCollections = collections && collections.length > 0
  const hasSingletons = singletons && singletons.length > 0
  const hasContent = hasCollections || hasSingletons

  if (isPending) return <AdminLoading />

  return (
    <AdminLayout title="Dashboard">
      {!hasContent ? (
        <LineBackground>
          <CollectionOnboarding />
          <SingletonOnboarding />
        </LineBackground>
      ) : (
        <>
          <div className="mb-8 flex h-12 items-center">
            <h1 className="mr-12 text-2xl text-foreground">Collections</h1>
            <Button asChild size="icon" variant="ghost">
              <Link href={`${dashboardRoute}/collections`}>
                <span className="sr-only">Edit Collections</span>
                <Settings className="w-6 h-6" />
              </Link>
            </Button>
          </div>
          {collections && collections.length ? (
            <div className="max-w-5xl w-full grid md:grid-cols-3 gap-6 mb-12">
              {collections.map((collection) => (
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
                    <div className="z-10 flex gap-2">
                      <Button asChild size="icon" variant="ghost">
                        <Link href={`${dashboardRoute}/${collection.slug}/new`}>
                          <span className="sr-only">
                            New {singular(collection.title)}
                          </span>
                          <Plus className="w-6 h-6" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <CollectionOnboarding />
          )}

          <div className="mb-8 flex h-12 items-center">
            <h1 className="mr-12 text-2xl text-foreground">Singletons</h1>
            <Button asChild size="icon" variant="ghost">
              <Link href={`${dashboardRoute}/singletons`}>
                <span className="sr-only">Edit Singletons</span>
                <Settings className="w-6 h-6" />
              </Link>
            </Button>
            <Button asChild size="icon" variant="ghost">
              <Link href={`${dashboardRoute}/singletons/new`}>
                <span className="sr-only">New Singleton</span>
                <Plus className="w-6 h-6" />
              </Link>
            </Button>
          </div>

          {singletons && singletons.length ? (
            <div className="max-w-5xl w-full grid md:grid-cols-3 gap-6">
              {singletons?.map((singleton) => (
                <Card
                  key={singleton.slug}
                  className="hover:border-gray-500 transition-all duration-300"
                >
                  <CardContent className="relative flex justify-between items-center">
                    <Link
                      href={`${dashboardRoute}/singletons/${singleton.slug}`}
                    >
                      <h5 className="text-2xl cursor-pointer font-bold tracking-tight text-foreground flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        {singleton.title}
                        <span className="absolute top-0 bottom-0 left-0 right-16"></span>
                      </h5>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <SingletonOnboarding />
          )}
        </>
      )}
    </AdminLayout>
  )
}
