import { useContext, useState } from 'react'
import { clsx } from 'clsx'
import { AdminLayout } from '../components'
import { OutstaticContext } from '../context'
import { MetadataBuilder } from '../components/MetadataBuilder'

export default function Settings() {
  const [rebuild, setRebuilding] = useState(false)
  const { repoSlug, repoBranch, contentPath } = useContext(OutstaticContext)

  return (
    <AdminLayout title="Settings">
      <div className="mb-8 flex h-12 items-center">
        <h1 className="mr-12 text-2xl">Settings</h1>
      </div>
      <div className="max-w-lg">
        <div className="mb-8 max-w-2xl p-8 px-4 md:p-8 text-black bg-white rounded-lg border border-gray-200 shadow-md prose prose-base">
          <h2>Metadata</h2>
          <div className="flex flex-row items-center">
            <button
              className={clsx(
                'cursor-pointer rounded-lg border px-5 py-2.5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-gray-700 no-underline',
                'text-white',
                'border-gray-600 bg-gray-800',
                rebuild && 'border-gray-400 bg-gray-500'
              )}
              onClick={() => setRebuilding(true)}
            >
              {rebuild ? 'Rebuilding...' : 'Rebuild Metadata'}
            </button>
            <MetadataBuilder
              className="pl-2"
              rebuild={rebuild}
              onComplete={() => setRebuilding(false)}
            />
          </div>
          <p className="text-sm">
            If you&apos;ve made changes outside of outstatic, or if you are
            seeing posts with incorrect metadata, you can rebuild your metadata
            and automatically deploy those changes to your site.
          </p>
        </div>

        <div className="mb-8 max-w-2xl p-8 px-4 md:p-8 text-black bg-white rounded-lg border border-gray-200 shadow-md prose prose-base">
          <h2>Environment</h2>
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900">
              Repository
            </label>
            <input
              className="cursor-not-allowed block p-2 w-full text-gray-900 bg-gray-50 rounded-lg border border-gray-300 sm:text-sm outline-none"
              value={repoSlug}
              readOnly
            />
          </div>
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
