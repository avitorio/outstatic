'use client'

import { AdminLayout } from '@/components/admin-layout'
import { DeleteMediaButton } from '@/components/delete-media-button'
import { MediaSettings } from '@/client/pages/settings/_components/media-settings'
import { MediaLibraryDropzone } from '@/components/ui/outstatic/media-library-dropzone'
import { MediaLibraryHeader } from '@/components/ui/outstatic/media-library-header'
import { SpinnerIcon } from '@/components/ui/outstatic/spinner-icon'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/shadcn/card'
import { API_MEDIA_PATH } from '@/utils/constants'
import { useGetMediaFiles } from '@/utils/hooks/use-get-media-files'
import { useMediaLibraryUpload } from '@/utils/hooks/use-media-library-upload'
import { useOutstatic } from '@/utils/hooks/use-outstatic'
import { FileQuestion, ImageOff } from 'lucide-react'
import { useMemo, useState } from 'react'

export default function MediaLibrary() {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [sortDirection, setSortDirection] = useState('desc')
  const {
    basePath,
    repoOwner,
    repoSlug,
    repoBranch,
    repoMediaPath,
    publicMediaPath
  } = useOutstatic()
  const apiPath = `${basePath}${API_MEDIA_PATH}${repoOwner}/${repoSlug}/${repoBranch}`
  const [notFoundFiles, setNotFoundFiles] = useState<Set<string>>(new Set())
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set())
  const { data, isLoading, refetch: refetchMedia } = useGetMediaFiles()
  const { handleFileUpload, isUploading } = useMediaLibraryUpload()

  const filteredFiles = useMemo(() => {
    if (!data) return []

    return data.media.media
      .filter((file) => {
        if (
          file.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
          file.alt.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          return true
        }

        return false
      })
      .sort((a, b) => {
        if (sortBy === 'date') {
          return sortDirection === 'asc'
            ? new Date(a.publishedAt).getTime() -
            new Date(b.publishedAt).getTime()
            : new Date(b.publishedAt).getTime() -
            new Date(a.publishedAt).getTime()
        }

        return sortDirection === 'asc'
          ? a.filename.localeCompare(b.filename)
          : b.filename.localeCompare(a.filename)
      })
  }, [data, searchTerm, sortBy, sortDirection])

  const handleImageLoad = (path: string) => {
    setLoadingImages((prev) => {
      const newSet = new Set(prev)
      newSet.delete(path)
      return newSet
    })
  }

  const handleImageError = (path: string) => {
    if (!notFoundFiles.has(path)) {
      setNotFoundFiles((prev) => new Set(prev).add(path))
    }

    handleImageLoad(path)
  }

  return (
    <AdminLayout title="Media Library" className="pt-0 md:pt-0">
      <div className="sticky top-0 z-10 bg-background pb-6 pt-10">
        <MediaLibraryHeader
          isUploading={isUploading}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortDirection={sortDirection}
          setSortDirection={setSortDirection}
          handleFileUpload={handleFileUpload}
          disableUpload={!repoMediaPath || !publicMediaPath}
        />
      </div>
      {!repoMediaPath || !publicMediaPath ? (
        <div className="max-w-lg">
          <Card>
            <CardHeader>
              <CardTitle>First time here?</CardTitle>
              <CardDescription>
                It seems you haven&apos;t set up your media paths yet.
                Let&apos;s do that!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MediaSettings />
            </CardContent>
          </Card>
        </div>
      ) : (
        <MediaLibraryDropzone
          className="min-h-[50vh] h-[calc(100vh-240px)]"
          disabled={isUploading}
          onFileDrop={handleFileUpload}
        >
          {isLoading && !data ? (
            <div className="flex min-h-[50vh] items-center justify-center">
              <SpinnerIcon size="2xl" />
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="flex min-h-[50vh] flex-col items-center justify-center text-gray-500">
              <FileQuestion className="mb-4 h-16 w-16" />
              <p>
                No media files available. Upload some files or drop an image
                here to get started!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
              {filteredFiles.map((file) => (
                <div
                  key={file.__outstatic.path}
                  className="group relative space-y-1 overflow-hidden rounded-lg bg-card"
                >
                  <div className="relative flex aspect-square items-center justify-center">
                    {!notFoundFiles.has(file.__outstatic.path) ? (
                      <>
                        {loadingImages.has(file.__outstatic.path) ? (
                          <div className="absolute inset-0 flex items-center justify-center rounded-md bg-gray-50">
                            <SpinnerIcon />
                          </div>
                        ) : null}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`${apiPath}/${file.__outstatic.path}`}
                          alt={file.alt}
                          className="h-full w-full rounded-md bg-slate-50 object-cover object-center"
                          width={288}
                          height={288}
                          onLoad={() => handleImageLoad(file.__outstatic.path)}
                          onError={() =>
                            handleImageError(file.__outstatic.path)
                          }
                          loading="lazy"
                        />
                      </>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center rounded-md bg-red-100/50">
                        <ImageOff className="h-12 w-12 text-red-500" />
                      </div>
                    )}
                    <DeleteMediaButton
                      path={file.__outstatic.path}
                      filename={file.filename}
                      disabled={false}
                      onComplete={async () => await refetchMedia()}
                      className="absolute right-2 top-2 bg-background/50 opacity-0 group-hover:opacity-100"
                      notFound={notFoundFiles.has(file.__outstatic.path)}
                    />
                  </div>
                  <div className="relative pb-4">
                    <div className="flex items-center justify-between">
                      <h3 className="truncate text-sm font-semibold">
                        {file.filename}
                      </h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </MediaLibraryDropzone>
      )}
    </AdminLayout>
  )
}
