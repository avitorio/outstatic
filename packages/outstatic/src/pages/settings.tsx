import { useContext } from 'react'
import { AdminLayout } from '../components'
import { OutstaticContext } from '../context'

export default function Settings() {
  const { repoSlug, contentPath } = useContext(OutstaticContext)
  return (
    <AdminLayout title="Settings">
      <div className="mb-8 flex h-12 items-center">
        <h1 className="mr-12 text-2xl">Settings</h1>
      </div>
      <div className="max-w-lg">
        <div className="mb-20 max-w-2xl p-8 px-4 md:p-8 text-black bg-white rounded-lg border border-gray-200 shadow-md prose prose-base">
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
              Content Path
            </label>
            <input
              className="cursor-not-allowed block p-2 w-full text-gray-900 bg-gray-50 rounded-lg border border-gray-300 sm:text-sm outline-none"
              value={`${contentPath}`}
              readOnly
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
