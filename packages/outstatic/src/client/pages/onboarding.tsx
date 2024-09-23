import { AdminLayout } from '@/components'
import { GitHubRepoSearch } from '@/components/ui/outstatic/github-repo-search'

export default function Onboarding() {
  return (
    <AdminLayout title="Onboarding">
      <div className="mb-8 flex h-12 items-center">
        <h1 className="mr-12 text-2xl">Welcome to Outstatic!</h1>
      </div>
      <div className="max-w-lg">
        <div className="mb-8 max-w-2xl p-8 px-4 md:p-8 text-black bg-white rounded-lg border border-gray-200 shadow-md prose prose-base">
          <h2>Pick your Repository</h2>
          <label className="block mb-2 text-sm font-medium text-gray-900">
            Repository
          </label>
          <GitHubRepoSearch />
          <p className="text-sm">
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
          </p>
        </div>
      </div>
    </AdminLayout>
  )
}
