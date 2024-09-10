import { AdminLayout } from '@/components'
import { API_MEDIA_PATH } from '@/utils/constants'
import { useOutstatic } from '@/utils/hooks'
import { useGetMediaFiles } from '@/utils/hooks/useGetMediaFiles'

export default function MediaLibrary() {
  const { basePath, repoOwner, repoSlug, repoBranch, session, gqlClient } =
    useOutstatic()
  const apiPath = `${basePath}${API_MEDIA_PATH}${repoOwner}/${repoSlug}/${repoBranch}/`
  const { data, isLoading, error } = useGetMediaFiles()

  return (
    <AdminLayout title="Media Library">
      <div className="mb-8 flex h-12 items-center capitalize">
        <h1 className="mr-12 text-2xl">Media Library</h1>
      </div>
      <div className="max-w-5xl w-full grid md:grid-cols-3 gap-6">
        {isLoading && <p>Loading media...</p>}
        {error && <p>Error loading media: {error.message}</p>}
        {data?.media &&
          data?.media.map(({ filename, alt }) => (
            <div key={filename} className="border p-4 rounded">
              <img
                src={`${apiPath}${filename}`}
                alt={alt}
                className="w-full h-full object-contain object-center"
              />
            </div>
          ))}
      </div>
    </AdminLayout>
  )
}
