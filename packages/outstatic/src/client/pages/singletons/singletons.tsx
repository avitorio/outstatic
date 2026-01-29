import { AdminLayout } from '@/components/admin-layout'
import { AdminLoading } from '@/components/admin-loading'
import { Button } from '@/components/ui/shadcn/button'
import { useGetMetadata } from '@/utils/hooks/useGetMetadata'
import Link from 'next/link'
import { useOutstatic } from '@/utils/hooks/useOutstatic'
import { FolderOpen } from 'lucide-react'
import SingletonOnboarding from '@/client/pages/singletons/_components/singleton-onboarding'
import LineBackground from '@/components/ui/outstatic/line-background'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/shadcn/tooltip'
import { useMemo, useState } from 'react'
import OpenFileModal from '@/client/pages/_components/open-file-modal'
import { useRouter } from 'next/navigation'
import { SingletonsTable } from '@/components/singletons-table'

export default function Singletons() {
  const { data: metadataData, isPending } = useGetMetadata()
  const { dashboardRoute, basePath } = useOutstatic()
  const [showOpenFileModal, setShowOpenFileModal] = useState(false)
  const router = useRouter()

  const singletons = useMemo(() => {
    if (!metadataData?.metadata?.metadata) return []
    return metadataData.metadata.metadata.filter(
      (item) => item.collection === '_singletons'
    )
  }, [metadataData])

  if (isPending) return <AdminLoading />

  return (
    <AdminLayout title="Singletons">
      {singletons.length === 0 ? (
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
                  <Button size="sm" onClick={() => setShowOpenFileModal(true)}>
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
          <div className="relative sm:rounded-lg">
            <SingletonsTable />
          </div>
        </>
      )}
      <OpenFileModal
        open={showOpenFileModal}
        onOpenChange={setShowOpenFileModal}
        onSelect={(filePath) => {
          setShowOpenFileModal(false)
          router.push(
            `${basePath}${dashboardRoute}/singletons/new?openFile=${encodeURIComponent(
              filePath
            )}`
          )
        }}
      />
    </AdminLayout>
  )
}
