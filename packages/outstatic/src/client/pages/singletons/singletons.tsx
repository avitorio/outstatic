import { AdminLayout } from '@/components/admin-layout'
import { AdminLoading } from '@/components/admin-loading'
import { Button } from '@/components/ui/shadcn/button'
import { useSingletons } from '@/utils/hooks/useSingletons'
import { Card, CardContent } from '@/components/ui/shadcn/card'
import Link from 'next/link'
import { useOutstatic } from '@/utils/hooks/useOutstatic'
import { FolderOpen, Settings } from 'lucide-react'
import SingletonOnboarding from './_components/singleton-onboarding'
import LineBackground from '@/components/ui/outstatic/line-background'
import { DeleteDocumentButton } from '@/components/delete-document-button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/shadcn/tooltip'
import { useState } from 'react'
import OpenFileModal from '../_components/open-file-modal'
import { useRouter } from 'next/navigation'

export default function Singletons() {
  const { data: singletons, isPending } = useSingletons()
  const { dashboardRoute, basePath } = useOutstatic()
  const [showOpenFileModal, setShowOpenFileModal] = useState(false)
  const router = useRouter()

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
            <div className="flex gap-2">
              <Button size="sm" asChild>
                <Link href={`${dashboardRoute}/singletons/new`}>
                  New Singleton
                </Link>
              </Button>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    onClick={() => setShowOpenFileModal(true)}
                  >
                    <span className="sr-only">Open from file</span>
                    <FolderOpen className="w-6 h-6" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Open from file</p>
                </TooltipContent>
              </Tooltip>
            </div>
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
                      <DeleteDocumentButton
                        slug={singleton.slug}
                        extension={singleton.path.endsWith('.mdx') ? 'mdx' : 'md'}
                        collection={"_singletons"}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </>
      )}
      <OpenFileModal
        open={showOpenFileModal}
        onOpenChange={setShowOpenFileModal}
        onSelect={(filePath) => {
          setShowOpenFileModal(false)
          router.push(
            `${basePath}${dashboardRoute}/singletons/new?openFile=${encodeURIComponent(filePath)}`
          )
        }}
      />
    </AdminLayout>
  )
}
