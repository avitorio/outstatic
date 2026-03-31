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
import { useLocalData } from '@/utils/hooks/use-outstatic'
import { CreateBranchDialog } from '@/components/ui/outstatic/create-branch-dialog'
import { useInitialData } from '@/utils/hooks/use-initial-data'
import CollectionOnboarding from '../collections/_components/collection-onboarding'
import SingletonOnboarding from '../singletons/_components/singleton-onboarding'

export default function ContentOnboarding() {
  const { repoBranch: initialRepoBranch } = useInitialData()
  const { setData } = useLocalData()
  const [showCreateBranchDialog, setShowCreateBranchDialog] = useState(false)
  const [userConfirmedBranch, setUserConfirmedBranch] = useState(false)

  const searchParams = useSearchParams()
  const confirmBranch =
    searchParams.get('confirmed') === 'true' ||
    initialRepoBranch ||
    userConfirmedBranch

  return (
    <>
      <div className="max-w-2xl">
        {confirmBranch ? (
          <div className="space-y-6">
            <div className="mb-8 flex flex-col gap-2 h-12 items-start">
              <h1 className="mr-12 text-2xl">Start your site</h1>
              <p>Most sites start with a Collection like Blog or Projects.</p>
            </div>

            <CollectionOnboarding />

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-3 text-xs text-muted-foreground mb-1">
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
                Hey! Just so you know, Outstatic saves everything to
                GitHub.{' '}
              </p>
              <p>
                If you&apos;re new here, try creating a new branch to play with.
                <br />
                You can always switch branches later.
              </p>
              <div className="flex flex-col lg:flex-row gap-3">
                <GitHubBranchSearch onboarding />
                <div className="flex gap-3">
                  <Button onClick={() => setUserConfirmedBranch(true)}>
                    Select
                  </Button>
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
    </>
  )
}
