import { GitHubRepoSearch } from '@/components/ui/outstatic/github-repo-search'
import { Card } from '@/components/ui/shadcn/card'

export default function RepoOnboarding() {
  return (
    <div className="max-w-lg">
      <Card className="mb-8 max-w-2xl p-8 px-4 md:p-8 prose prose-base dark:prose-invert">
        <h2 className='text-foreground'>Pick your Repository</h2>
        <label className="block mb-2 text-sm font-medium text-foreground">
          Repository
        </label>
        <GitHubRepoSearch />
        <p className="text-sm">
          <span className="font-semibold">Optional:</span> You can set default
          repository and branch variables directly on your .env files. To learn
          more{' '}
          <a
            href="https://outstatic.com/docs/environment-variables"
            target="_blank"
            rel="noreferrer"
            className="underline font-semibold"
          >
            click here
          </a>
          .
        </p>
      </Card>
    </div>
  )
}
