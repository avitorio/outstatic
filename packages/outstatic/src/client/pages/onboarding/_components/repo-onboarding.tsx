import { GitHubRepoSearch } from '@/components/ui/outstatic/github-repo-search'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader
} from '@/components/ui/shadcn/card'

export default function RepoOnboarding() {
  return (
    <div className="max-w-lg">
      <Card className="prose prose-base dark:prose-invert">
        <CardHeader className="text-foreground">
          Pick your Repository
        </CardHeader>
        <CardContent>
          <GitHubRepoSearch />
        </CardContent>
        <CardFooter>
          <div>
            <span className="font-semibold">Optional:</span> You can set default
            repository and branch variables directly on your .env files. To
            learn more{' '}
            <a
              href="https://outstatic.com/docs/environment-variables"
              target="_blank"
              rel="noreferrer"
              className="underline font-semibold"
            >
              click here
            </a>
            .
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
