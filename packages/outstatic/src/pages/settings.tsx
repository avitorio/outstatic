import { useContext } from 'react'
import { AdminLayout } from '../components'
import { OutstaticContext } from '../context'

export default function Settings() {
  const { repoSlug, contentPath } = useContext(OutstaticContext)
  return (
    <AdminLayout>
      <div className="mb-8 flex h-12 items-center">
        <h1 className="mr-12 text-2xl">Settings</h1>
      </div>
      <p>Repository: {`${repoSlug}`}</p>
      <p>Content Path: {`${contentPath}`}</p>
    </AdminLayout>
  )
}
