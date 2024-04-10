import { AdminLayout } from '@/components'
import GitHubRepoSearch from '@/components/GitHubRepoSearch'
import useOutstatic from '@/utils/hooks/useOutstatic'

export default function Onboarding() {
  const { repoBranch, contentPath } = useOutstatic()

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
          <div className="mt-4">
            <label className="block mb-2 text-sm font-medium text-gray-900">
              Branch
            </label>
            <input
              className="cursor-not-allowed block p-2 w-full text-gray-900 bg-gray-50 rounded-lg border border-gray-300 sm:text-sm outline-none"
              value={repoBranch}
              readOnly
            />
          </div>
          <div className="mt-4">
            <label className="block mb-2 text-sm font-medium text-gray-900">
              Content Path
            </label>
            <input
              className="cursor-not-allowed block p-2 w-full text-gray-900 bg-gray-50 rounded-lg border border-gray-300 sm:text-sm outline-none"
              value={`${contentPath}`}
              readOnly
            />
          </div>
          <p className="text-sm">
            These values come from your Outstatic environment. To learn more
            about how to update these values,{' '}
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
