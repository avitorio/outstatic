import { Button } from '@/components/ui/shadcn/button'
import { Card, CardContent } from '@/components/ui/shadcn/card'
import { useOutstatic } from '@/utils/hooks/use-outstatic'
import Link from 'next/link'
import OpenFileModal from '@/client/pages/_components/open-file-modal'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/shadcn/tooltip'

export default function SingletonOnboarding() {
  const { dashboardRoute, basePath } = useOutstatic()
  const [showOpenFileModal, setShowOpenFileModal] = useState(false)
  const router = useRouter()

  return (
    <div className="max-w-2xl">
      <Card className="border shadow-sm bg-background">
        <CardContent>
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">Create a Singleton</h2>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="text-muted-foreground hover:text-foreground transition-colors">
                        <Info className="h-4 w-4" />
                        <span className="sr-only">Learn about singletons</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p>
                        Singletons are one-off documents that exist
                        independently. Use them for pages that don&apos;t
                        repeat.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-sm text-muted-foreground">
                  Used for one-off pages and site-wide settings
                </p>
              </div>

              {/* Examples as bullet points */}
              <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <li className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/60" />
                  About page
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/60" />
                  Homepage settings
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/60" />
                  Contact page
                </li>
              </ul>

              {/* Secondary actions */}
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" asChild>
                  <Link
                    href={`${dashboardRoute}/singletons/new`}
                    className="no-underline"
                  >
                    New Singleton
                  </Link>
                </Button>
                <span className="text-sm text-muted-foreground">or</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowOpenFileModal(true)}
                >
                  Open a File
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                You can always add Singletons later.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
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
    </div>
  )
}
