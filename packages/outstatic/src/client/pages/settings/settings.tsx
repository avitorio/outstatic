import { AdminLayout } from '@/components/admin-layout'
import { GitHubRepoSearch } from '@/components/ui/outstatic/github-repo-search'
import { Button } from '@/components/ui/shadcn/button'
import { useCollections } from '@/utils/hooks/use-collections'
import { useOutstatic } from '@/utils/hooks/use-outstatic'
import { useState } from 'react'
import { MediaSettings } from './_components/media-settings'
import { DocumentFormatSettings } from './_components/document-format-settings'
import { useRebuildMetadata } from '@/utils/hooks/use-rebuild-metadata'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/shadcn/card'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function Settings() {
  const [rebuild, setRebuilding] = useState(false)
  const { data: collections } = useCollections()
  const { repoOwner, repoSlug } = useOutstatic()
  const repositoryUrl =
    repoOwner && repoSlug ? `https://github.com/${repoOwner}/${repoSlug}` : ''

  const rebuildMetadata = useRebuildMetadata()

  return (
    <AdminLayout title="Settings">
      <div className="mb-8 flex h-12 items-center">
        <h1 className="mr-12 text-2xl">Settings</h1>
      </div>
      <div className="flex max-w-2xl flex-1 flex-col space-y-6">
        <Card className="mb-8 max-w-2xl">
          <CardHeader>
            <CardTitle>Repository</CardTitle>
            <CardDescription>
              Set your default repository and branch for Outstatic content.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Repository
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <GitHubRepoSearch />
                </div>
                {repositoryUrl ? (
                  <Link target="_blank" rel="noreferrer" href={repositoryUrl}>
                    <Button
                      variant="outline"
                      size="icon"
                      title="Open repository"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                ) : null}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Optional:</span>{' '}
              You can set default repository and branch variables directly on
              your `.env` files. To learn more{' '}
              <a
                href="https://outstatic.com/docs/environment-variables"
                target="_blank"
                rel="noreferrer"
                className="font-semibold underline"
              >
                click here
              </a>
              .
            </p>
          </CardContent>
        </Card>
        <Card className="mb-8 max-w-2xl">
          <CardHeader>
            <CardTitle>Media Library</CardTitle>
            <CardDescription>
              Configure where uploaded media files are stored and served from.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MediaSettings />
          </CardContent>
        </Card>
        <Card className="mb-8 max-w-2xl">
          <CardHeader>
            <CardTitle>Documents</CardTitle>
            <CardDescription>
              Choose the default format for newly created documents.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DocumentFormatSettings />
          </CardContent>
        </Card>

        {collections && collections.length > 0 ? (
          <Card className="mb-8 max-w-2xl">
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
              <CardDescription>
                Rebuild metadata when content has changed outside of Outstatic.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-row items-center">
                <Button
                  disabled={rebuild}
                  onClick={() => {
                    setRebuilding(true)
                    rebuildMetadata({
                      onComplete: () => setRebuilding(false)
                    })
                  }}
                >
                  {rebuild ? 'Rebuilding...' : 'Rebuild Metadata'}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                If you&apos;ve made changes outside of outstatic, or if you are
                seeing posts with incorrect metadata, you can rebuild your
                metadata and automatically deploy those changes to your site.
              </p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </AdminLayout>
  )
}
