'use client'

import { AdminLayout } from '@/components'
import { API_MEDIA_PATH } from '@/utils/constants'
import { useOutstatic } from '@/utils/hooks'
import { useGetMediaFiles } from '@/utils/hooks/useGetMediaFiles'
import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/shadcn/button'
import { Input } from '@/components/ui/shadcn/input'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/shadcn/select'
import { MediaItem } from '@/utils/metadata/types'
import { toast } from 'sonner'
import useSubmitMedia from '@/utils/hooks/useSubmitMedia'
import { FileType } from '@/types'
import DeleteMediaButton from '@/components/DeleteMediaButton'

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
            ? new Date(a.publishedAt) - new Date(b.publishedAt)
            : new Date(b.publishedAt) - new Date(a.publishedAt)
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
    <AdminLayout title="Media Library">
      <div className="flex items-center justify-between mb-6">
        <div className="flex h-12 items-center capitalize gap-12">
          <h1 className="text-2xl">Media Library</h1>
          <Button
            asChild
            className="hover:cursor-pointer"
            disabled={isUploading}
          >
            <label htmlFor="fileInput">
              {isUploading ? 'Uploading...' : 'Add Media'}
            </label>
          </Button>
          <input
            id="fileInput"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              console.log('File input change detected')
              handleFileUpload(e.target.files)
            }}
          />
        </div>
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Select
            value={sortBy}
            className="w-40"
            onValueChange={(value) => setSortBy(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={sortDirection}
            className="w-40"
            onValueChange={(value) => setSortDirection(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort direction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Ascending</SelectItem>
              <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div
        className="grid gap-6 sm:grid-cols-4 md:grid-cols-6 2xl:grid-cols-8"
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
