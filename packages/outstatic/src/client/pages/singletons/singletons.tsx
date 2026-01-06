import { AdminLayout } from '@/components/admin-layout'
import { AdminLoading } from '@/components/admin-loading'
import { Button } from '@/components/ui/shadcn/button'
import { useSingletons } from '@/utils/hooks/useSingletons'
import { SingletonType } from '@/types'
import { Card, CardContent } from '@/components/ui/shadcn/card'
import Link from 'next/link'
import { useState } from 'react'
import DeleteSingletonModal from './_components/delete-singleton-modal'
import { useOutstatic } from '@/utils/hooks/useOutstatic'
import { Settings, Trash } from 'lucide-react'
import SingletonOnboarding from './_components/singleton-onboarding'
import LineBackground from '@/components/ui/outstatic/line-background'

export default function Singletons() {
  const { data: singletons, isPending } = useSingletons()
  const { dashboardRoute } = useOutstatic()

  const [selectedSingleton, setSelectedSingleton] =
    useState<SingletonType | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  if (isPending) return <AdminLoading />

  return (
    <AdminLayout title="Singletons">
      {!singletons || singletons.length === 0 ? (
        <LineBackground>
          <SingletonOnboarding />
        </LineBackground>
      ) : (
        <>
          <div className="mb-8 flex h-12 items-center">
            <h1 className="mr-12 text-2xl text-foreground">Singletons</h1>
            <Button size="sm" asChild>
              <Link href={`${dashboardRoute}/singletons/new`}>
                New Singleton
              </Link>
            </Button>
          </div>
          <div className="max-w-5xl w-full grid md:grid-cols-3 gap-6">
            {singletons &&
              singletons.map((singleton) => (
                <Card
                  key={singleton.slug}
                  className="hover:border-gray-500 transition-all duration-300"
                >
                  <CardContent className="relative flex justify-between items-center">
                    <Link
                      href={`${dashboardRoute}/singletons/${singleton.slug}`}
                    >
                      <h5 className="text-2xl cursor-pointer font-bold tracking-tight text-foreground">
                        {singleton.title}
                        <span className="absolute top-0 bottom-0 left-0 right-16"></span>
                      </h5>
                    </Link>
                    <div className="z-10 flex gap-2">
                      <Button asChild size="icon" variant="ghost">
                        <Link
                          href={`${dashboardRoute}/singletons/${singleton.slug}/fields`}
                        >
                          <span className="sr-only">Edit singleton fields</span>
                          <Settings className="w-6 h-6" />
                        </Link>
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        type="button"
                        onClick={() => {
                          setShowDeleteModal(true)
                          setSelectedSingleton(singleton)
                        }}
                      >
                        <span className="sr-only">Delete singleton</span>
                        <Trash className="w-6 h-6" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </>
      )}

      {showDeleteModal && selectedSingleton ? (
        <DeleteSingletonModal
          setShowDeleteModal={setShowDeleteModal}
          setSelectedSingleton={setSelectedSingleton}
          singleton={selectedSingleton}
        />
      ) : null}
    </AdminLayout>
  )
}
