import { Button } from '@/components/ui/shadcn/button'
import { useSearchParams } from 'next/navigation'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/shadcn/card'
import Link from 'next/link'
import { GitHubBranchSearch } from '@/components/ui/outstatic/github-branch-search'
import { useState } from 'react'
import { useLocalData, useOutstatic } from '@/utils/hooks/useOutstatic'
import { CreateBranchDialog } from '@/components/ui/outstatic/create-branch-dialog'
import NewCollectionModal from './new-collection-modal'
import { useInitialData } from '@/utils/hooks/useInitialData'

export default function CollectionOnboarding() {
  const { repoBranch: initialRepoBranch } = useInitialData()
  const { dashboardRoute } = useOutstatic()
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
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle>Create a Collection</CardTitle>
              <CardDescription>
                Get started with your first Collection
              </CardDescription>
            </CardHeader>
            <CardContent className="prose prose-base">
              <p>
                To get started you will need to create a new Collection.
                Collections are the main building block of your Outstatic
                website.
              </p>
              <p>Create your first Collection by clicking the button below.</p>
              <Button onClick={() => setShowNewCollectionModal(true)}>
                New Collection
              </Button>
              <p>
                To learn more about how Collections work{' '}
                <a
                  href="https://outstatic.com/docs/introduction#what-are-collections"
                  target="_blank"
                  rel="noreferrer"
                >
                  click here
                </a>
                .
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle>Confirm Branch</CardTitle>
              <CardDescription>
                Confirm the branch before creating your first Collection
              </CardDescription>
            </CardHeader>
            <CardContent className="prose prose-base">
              <p>
                Hey! Just so you know, Outstatic saves everything to GitHub.{' '}
              </p>
              <p>
                If you&apos;re new here, try creating a new branch to play with.
                <br />
                You can always switch branches later.
              </p>
              <div className="flex gap-3">
                <GitHubBranchSearch onboarding />
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
