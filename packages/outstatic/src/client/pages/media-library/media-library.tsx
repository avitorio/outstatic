'use client'

import { AdminLayout } from '@/components'
import { API_MEDIA_PATH } from '@/utils/constants'
import { useOutstatic } from '@/utils/hooks'
import { useGetMediaFiles } from '@/utils/hooks/useGetMediaFiles'
import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import useSubmitMedia from '@/utils/hooks/useSubmitMedia'
import { FileType } from '@/types'
import DeleteMediaButton from '@/components/DeleteMediaButton'
import { MediaLibraryHeader } from '@/components/ui/outstatic/media-library-header'

export default function MediaLibrary() {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [sortDirection, setSortDirection] = useState('desc')
  const { basePath, repoOwner, repoSlug, repoBranch } = useOutstatic()
  const apiPath = `${basePath}${API_MEDIA_PATH}${repoOwner}/${repoSlug}/${repoBranch}/`
  const { data, isLoading, error, refetch } = useGetMediaFiles()
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
          toast.success(`${file.name} uploaded successfully`)
        } catch (error) {
          toast.error(`Failed to upload ${file.name}`)
        }
      }
    }

    reader.readAsDataURL(file)

    setIsUploading(false)
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
        />
      </div>
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
            key={file.filename}
            className={`space-y-1 bg-card rounded-lg overflow-hidden cursor-pointer group relative`}
          >
            <div className="aspect-square">
              <img
                src={`${apiPath}${file.filename}`}
                alt={file.alt}
                className="w-full h-full object-cover object-center rounded-md"
              />
              <DeleteMediaButton
                path={file.__outstatic.path}
                filename={file.filename}
                disabled={false}
                onComplete={() => refetch()}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-white/50"
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
    </AdminLayout>
  )
}
