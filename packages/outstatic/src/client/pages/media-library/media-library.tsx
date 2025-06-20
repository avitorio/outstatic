'use client'

import { AdminLayout } from '@/components'
import { API_MEDIA_PATH } from '@/utils/constants'
import { useOutstatic } from '@/utils/hooks/useOutstatic'
import { useGetMediaFiles } from '@/utils/hooks/useGetMediaFiles'
import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import useSubmitMedia from '@/utils/hooks/useSubmitMedia'
import { FileType } from '@/types'
import { DeleteMediaButton } from '@/components/DeleteMediaButton'
import { MediaLibraryHeader } from '@/components/ui/outstatic/media-library-header'
import { FileQuestion, ImageOff } from 'lucide-react'
import { SpinnerIcon } from '@/components/ui/outstatic/spinner-icon'
import { MediaSettings } from '@/client/pages/settings/_components/media-settings'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/shadcn/card'

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
  const { data, isLoading, error, refetch: refetchMedia } = useGetMediaFiles()
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
        } else {
          return sortDirection === 'asc'
            ? a.filename.localeCompare(b.filename)
            : b.filename.localeCompare(a.filename)
        }
      })
  }, [data, searchTerm, sortBy, sortDirection])

  const [isUploading, setIsUploading] = useState(false)

  const submitMedia = useSubmitMedia({
    setLoading: setIsUploading,
    file: {} as FileType
  })

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return
    }

    setIsUploading(true)

    const file = files[0]
    const reader = new FileReader()

    reader.onload = async (e) => {
      if (e.target && e.target.result) {
        const fileContents = e.target.result as string
        const fileType: FileType = {
          filename: file.name,
          type: 'image',
          content: fileContents.split(',')[1] // Remove the data URL prefix
        }

        try {
          await submitMedia(fileType)
        } catch (error) {
          toast.error(`Failed to upload ${file.name}`)
        }
      }
    }

    reader.readAsDataURL(file)

    setIsUploading(false)
  }

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
    handleImageLoad(path) // Remove from loading state
  }

  return (
    <AdminLayout title="Media Library" className="pt-0 md:pt-0">
      <div className="pb-6 pt-5 sticky top-0 z-10 bg-background">
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
      ) : isLoading ? (
        <div className="flex items-center justify-center h-[80%]">
          <SpinnerIcon size="2xl" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-[80%] text-red-500">
          Error loading media files. Please try again.
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[80%] text-gray-500">
          <FileQuestion className="w-16 h-16 mb-4" />
          <p>No media files available. Upload some files to get started!</p>
        </div>
      ) : (
        <div
          className="grid gap-4 grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            handleFileUpload(e.dataTransfer.files)
          }}
        >
          {filteredFiles.map((file) => (
            <div
              key={file.__outstatic.path}
              className={`space-y-1 bg-card rounded-lg overflow-hidden cursor-pointer group relative`}
            >
              <div className="aspect-square relative flex items-center justify-center">
                {!notFoundFiles.has(file.__outstatic.path) && (
                  <>
                    {loadingImages.has(file.__outstatic.path) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-md">
                        <SpinnerIcon />
                      </div>
                    )}
                    <img
                      src={`${apiPath}/${file.__outstatic.path}`}
                      alt={file.alt}
                      className="w-full h-full object-cover object-center rounded-md bg-slate-50"
                      width={288}
                      height={288}
                      onLoad={() => handleImageLoad(file.__outstatic.path)}
                      onError={() => handleImageError(file.__outstatic.path)}
                      loading="lazy"
                    />
                  </>
                )}
                {notFoundFiles.has(file.__outstatic.path) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-100/50 rounded-md">
                    <ImageOff className="w-12 h-12 text-red-500" />
                  </div>
                )}
                <DeleteMediaButton
                  path={file.__outstatic.path}
                  filename={file.filename}
                  disabled={false}
                  onComplete={async () => await refetchMedia()}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-white/50"
                  notFound={notFoundFiles.has(file.__outstatic.path)}
                />
              </div>
              <div className="pb-4 relative">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm truncate">
                    {file.filename}
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  )
}
