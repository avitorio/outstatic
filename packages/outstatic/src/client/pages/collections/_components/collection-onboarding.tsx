import { Button } from '@/components/ui/shadcn/button'
import { Card, CardContent } from '@/components/ui/shadcn/card'
import { useState } from 'react'
import NewCollectionModal from './new-collection-modal'
import { Folder, Info, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/shadcn/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/shadcn/tooltip'

export default function CollectionOnboarding() {
  const [showNewCollectionModal, setShowNewCollectionModal] = useState(false)

  return (
    <>
      <Card className="relative border-2 border-primary/20 shadow-sm max-w-2xl">
        <CardContent>
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Folder className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">
                      Create a Collection
                    </h2>
                    <Badge variant="secondary" className="text-xs font-medium">
                      Recommended
                    </Badge>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="text-muted-foreground hover:text-foreground transition-colors">
                          <Info className="h-4 w-4" />
                          <span className="sr-only">
                            Learn about collections
                          </span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p>
                          Collections are groups of similar content that share
                          the same structure. Perfect for blog posts, products,
                          or team members.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Used for repeating content with the same structure
                  </p>
                </div>
              </div>

              {/* Examples as bullet points */}
              <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <li className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/60" />
                  Blog posts
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/60" />
                  Projects
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/60" />
                  Case studies
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/60" />
                  Team members
                </li>
              </ul>

              {/* Primary action */}
              <Button
                className="gap-2"
                onClick={() => setShowNewCollectionModal(true)}
              >
                New Collection
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {showNewCollectionModal && (
        <NewCollectionModal
          open={showNewCollectionModal}
          onOpenChange={setShowNewCollectionModal}
        />
      )}
    </>
  )
}
