import { Button } from '@/components/ui/shadcn/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/shadcn/card'
import { useOutstatic } from '@/utils/hooks/useOutstatic'
import { FolderOpen } from 'lucide-react'
import Link from 'next/link'
import OpenFileModal from '@/client/pages/_components/open-file-modal'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SingletonOnboarding() {
  const { dashboardRoute, basePath } = useOutstatic()
  const [showOpenFileModal, setShowOpenFileModal] = useState(false)
  const router = useRouter()

  return (
    <div className="max-w-2xl">
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle>Create a Singleton</CardTitle>
          <CardDescription>
            Get started with your first Singleton
          </CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert">
          <p>
            Singletons are one-off documents that exist independently of
            collections.
            <br />
            They&apos;re perfect for static pages like About or Contact, and
            for site-wide settings.
          </p>
          <p>Create your first Singleton or open an existing Markdown file.</p>
          <div className="flex items-center gap-2">
            <Button asChild>
              <Link href={`${dashboardRoute}/singletons/new`} className="no-underline">
                New Singleton
              </Link>
            </Button>
            or
            <Button
              onClick={() => setShowOpenFileModal(true)}
            >
              Open a Markdown File
            </Button>
          </div>
        </CardContent>
      </Card>
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
    </div>
  )
}
