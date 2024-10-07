'use client'

import { API_MEDIA_PATH } from '@/utils/constants'
import { useOutstatic } from '@/utils/hooks'
import { useGetMediaFiles } from '@/utils/hooks/useGetMediaFiles'
import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/shadcn/button'
import { toast } from 'sonner'
import useSubmitMedia from '@/utils/hooks/useSubmitMedia'
import { FileType } from '@/types'
import { DeleteMediaButton } from '@/components/DeleteMediaButton'
import {
  Dialog,
  DialogFooter,
  DialogContent,
  DialogTitle,
  DialogHeader
} from '@/components/ui/shadcn/dialog'
import { MediaItem } from '@/utils/metadata/types'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'
import { MediaLibraryHeader } from './media-library-header'
import Image from 'next/image'
import { SpinnerIcon } from './spinner-icon'
import { FileQuestion } from 'lucide-react'

export default function MediaLibraryModal({
  open,
  onOpenChange,
  onSelect
}: {
  open: boolean
  onOpenChange: (show: boolean) => void
  onSelect: (imageUrl: string) => void
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [sortDirection, setSortDirection] = useState('desc')
  const [selectedImage, setSelectedImage] = useState<MediaItem | null>(null)

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
        } catch (error) {
          toast.error(`Failed to upload ${file.name}`)
        }
      }
    }

    reader.readAsDataURL(file)

    setIsUploading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-full max-w-[96%] max-h-[96%] flex flex-col">
        <DialogHeader>
          <VisuallyHidden.Root>
            <DialogTitle>Media Library</DialogTitle>
          </VisuallyHidden.Root>
          <div className="space-y-6 px-[2px] pt-2">
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
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <SpinnerIcon size="2xl" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center text-red-500 h-full">
            Error loading media files. Please try again.
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-gray-500 h-full">
            <FileQuestion className="w-16 h-16 mb-4" />
            <p>No media files available. Upload some files to get started!</p>
          </div>
        ) : (
          <div className="flex flex-col justify-between h-full max-h-[calc(100%-80px)]">
            <div
              className="overflow-y-auto h-full p-[2px]"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                handleFileUpload(e.dataTransfer.files)
              }}
            >
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 md:grid-cols-6 2xl:grid-cols-8 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                {filteredFiles.map((file) => (
                  <div
                    key={file.filename}
                    className={`space-y-1 p-2 bg-card rounded-lg overflow-hidden cursor-pointer group relative  ${
                      selectedImage?.filename === file.filename
                        ? 'ring-1 ring-primary bg-slate-50'
                        : ''
                    }`}
                    onClick={() => setSelectedImage(file)}
                  >
                    <div className="aspect-square">
                      <Image
                        src={`${apiPath}${file.__outstatic.path}`}
                        alt={file.alt}
                        className="w-full h-full object-cover object-center rounded-md"
                        width={288}
                        height={288}
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
            </div>
            <DialogFooter className="px-[2px] flex flex-end pt-8">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                disabled={!selectedImage}
                onClick={() => {
                  onSelect(`${apiPath}${selectedImage?.__outstatic.path}`)
                  onOpenChange(false)
                }}
              >
                Select
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
