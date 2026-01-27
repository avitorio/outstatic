import { Button } from '@/components/ui/shadcn/button'
import { useSearchParams } from 'next/navigation'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/shadcn/card'
import { GitHubBranchSearch } from '@/components/ui/outstatic/github-branch-search'
import { useState } from 'react'
import { useLocalData } from '@/utils/hooks/useOutstatic'
import { CreateBranchDialog } from '@/components/ui/outstatic/create-branch-dialog'
import NewCollectionModal from './new-collection-modal'
import { useInitialData } from '@/utils/hooks/useInitialData'
import SingletonOnboarding from '@/client/pages/singletons/_components/singleton-onboarding'
import { Folder, Info, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/shadcn/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/shadcn/tooltip'

export default function CollectionOnboarding() {
  const { repoBranch: initialRepoBranch } = useInitialData()
  const { setData } = useLocalData()
  const [showCreateBranchDialog, setShowCreateBranchDialog] = useState(false)
  const [showNewCollectionModal, setShowNewCollectionModal] = useState(false)

  const searchParams = useSearchParams()
  const [confirmBranch, setConfirmBranch] = useState(
    searchParams.get('confirmed') === 'true' || initialRepoBranch
  )

  return (
    <>
      <div className="max-w-2xl">
        {confirmBranch ? (
          <div className="space-y-6">
            <div className="mb-8 flex flex-col gap-2 h-12 items-start">
              <h1 className="mr-12 text-2xl">Start your site
              </h1>
              <p>Most sites start with a Collection like Blog or Projects.</p>
            </div>
            <Card className="relative border-2 border-primary/20 shadow-sm py-6">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Folder className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-semibold">Create a Collection</h2>
                          <Badge variant="secondary" className="text-xs font-medium">
                            Recommended
                          </Badge>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button className="text-muted-foreground hover:text-foreground transition-colors">
                                <Info className="h-4 w-4" />
                                <span className="sr-only">Learn about collections</span>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p>Collections are groups of similar content that share the same structure. Perfect for blog posts, products, or team members.</p>
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

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-muted-foreground mb-1">
                  or start with a standalone page
                </span>
              </div>
            </div>

            <SingletonOnboarding />
          </div>
        ) : (
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle>Confirm your Branch</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert">
              <p>
                Hey! Just so you know, Outstatic saves everything to GitHub.{' '}
              </p>
              <p>
                If you&apos;re new here, try creating a new branch to play with.
                <br />
                You can always switch branches later.
              </p>
              <div className="flex flex-col lg:flex-row gap-3">
                <GitHubBranchSearch onboarding />
                <div className="flex gap-3">
                  <Button onClick={() => setConfirmBranch(true)}>Select</Button>
                  <span className="text-muted-foreground h-10 flex items-center">
                    or
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateBranchDialog(true)}
                  >
                    Create Branch
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <CreateBranchDialog
        branchName={''}
        showCreateBranchDialog={showCreateBranchDialog}
        setShowCreateBranchDialog={(value) => {
          setShowCreateBranchDialog(value)
        }}
        callbackFunction={({ branchName }: { branchName: string }) => {
          const currentUrl = new URL(window.location.href)
          currentUrl.searchParams.set('confirmed', 'true')
          window.history.pushState({}, '', currentUrl)
          setData({ repoBranch: branchName })
        }}
      />

      {showNewCollectionModal && (
        <NewCollectionModal
          open={showNewCollectionModal}
          onOpenChange={setShowNewCollectionModal}
        />
      )}
    </>
  )
}
