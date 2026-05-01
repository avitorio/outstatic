'use client'

import { MediaSettings } from '@/client/pages/settings/_components/media-settings'
import { DeleteMediaButton } from '@/components/delete-media-button'
import { Button } from '@/components/ui/shadcn/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/shadcn/dialog'
import {
  Card,
  CardContent,
  CardDescription as CardBodyDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/shadcn/card'
import { API_MEDIA_PATH } from '@/utils/constants'
import { MediaItem } from '@/utils/metadata/types'
import { useGetMediaFiles } from '@/utils/hooks/use-get-media-files'
import { useMediaLibraryUpload } from '@/utils/hooks/use-media-library-upload'
import { useOutstatic } from '@/utils/hooks/use-outstatic'
import { getMediaSourceForItem, isImageMediaSource } from '@/utils/media-config'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'
import { FileQuestion } from 'lucide-react'
import { useMemo, useState } from 'react'
import { MediaLibraryDropzone } from './media-library-dropzone'
import { MediaLibraryHeader } from './media-library-header'
import { SpinnerIcon } from './spinner-icon'

export default function MediaLibraryModal({
  open,
  onOpenChange,
  onSelect
}: {
  open: boolean
  onOpenChange: (show: boolean) => void
  onSelect: (imageUrl: string) => void
}) {
  const { basePath, media, repoOwner, repoSlug, repoBranch } = useOutstatic()
  const imageSources = useMemo(
    () => (media ?? []).filter((source) => isImageMediaSource(source)),
    [media]
  )
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [sortDirection, setSortDirection] = useState('desc')
  const [selectedImage, setSelectedImage] = useState<MediaItem | null>(null)
  const [selectedSourceName, setSelectedSourceName] = useState<
    string | undefined
  >(() => imageSources[0]?.name)
  const activeSourceName = imageSources.some(
    (source) => source.name === selectedSourceName
  )
    ? selectedSourceName
    : imageSources[0]?.name
  const selectedSource = activeSourceName
    ? imageSources.find((source) => source.name === activeSourceName)
    : undefined
  const apiPath = `${basePath}${API_MEDIA_PATH}${repoOwner}/${repoSlug}/${repoBranch}/`
  const { data, isLoading, refetch } = useGetMediaFiles()
  const { handleFileUpload, isUploading } = useMediaLibraryUpload({
    source: selectedSource
  })

  const handleSelectedSourceNameChange = (value: string) => {
    setSelectedSourceName(value)
    setSelectedImage(null)
  }

  const filteredFiles = useMemo(() => {
    if (!data) return []

    return data.media.media
      .filter((file) => file.type === 'image')
      .filter((file) => {
        if (!selectedSource) {
          return false
        }

        return (
          getMediaSourceForItem(file, imageSources)?.name ===
          selectedSource.name
        )
      })
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
  }, [data, imageSources, searchTerm, selectedSource, sortBy, sortDirection])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-full max-h-[96%] w-full flex-col md:max-w-[96%]">
        <DialogHeader>
          <VisuallyHidden.Root>
            <DialogTitle>Media Library</DialogTitle>
            <DialogDescription>
              Select an image to insert into your content.
            </DialogDescription>
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
              mediaSources={imageSources}
              selectedSourceName={activeSourceName}
              setSelectedSourceName={handleSelectedSourceNameChange}
              handleFileUpload={handleFileUpload}
              disableUpload={!imageSources.length}
              showAllMediaOption={false}
            />
          </div>
        </DialogHeader>
        {!imageSources.length ? (
          <div className="flex h-full w-full items-center justify-center">
            <div className="mb-12 max-w-lg">
              <Card>
                <CardHeader>
                  <CardTitle>Add an image source</CardTitle>
                  <CardBodyDescription>
                    Configure at least one image-capable media source to upload
                    and select images here.
                  </CardBodyDescription>
                </CardHeader>
                <CardContent>
                  <MediaSettings />
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <MediaLibraryDropzone
            className="min-h-0 flex-1"
            disabled={isUploading}
            dropLabel="Drop images to upload"
            dropDescription="Outstatic will upload up to 10 images you drop here."
            onFileDrop={handleFileUpload}
          >
            {isLoading && !data ? (
              <div className="flex h-full items-center justify-center">
                <SpinnerIcon size="2xl" />
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-gray-500">
                <FileQuestion className="mb-4 h-16 w-16" />
                <p>
                  No images available. Upload an image or drop one here to get
                  started.
                </p>
              </div>
            ) : (
              <div className="flex h-full flex-col justify-between">
                <div className="h-full overflow-y-auto p-[2px]">
                  <div className="grid grid-cols-2 gap-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 sm:grid-cols-4 md:grid-cols-6 2xl:grid-cols-8">
                    {filteredFiles.map((file) => (
                      <div
                        key={file.filename}
                        className={`group relative cursor-pointer space-y-1 overflow-hidden rounded-lg bg-card p-2 ${
                          selectedImage?.filename === file.filename
                            ? 'bg-muted ring-1 ring-primary'
                            : ''
                        }`}
                        onClick={() => setSelectedImage(file)}
                      >
                        <div className="aspect-square">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`${apiPath}${file.__outstatic.path}`}
                            alt={file.alt}
                            className="h-full w-full rounded-md object-cover object-center"
                            width={288}
                            height={288}
                          />
                          <DeleteMediaButton
                            path={file.__outstatic.path}
                            filename={file.filename}
                            disabled={isUploading}
                            onComplete={() => {
                              void refetch()
                            }}
                            className="absolute right-2 top-2 bg-background/50 opacity-0 group-hover:opacity-100"
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
                </div>
                <DialogFooter className="flex flex-end px-[2px] pt-8">
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
          </MediaLibraryDropzone>
        )}
      </DialogContent>
    </Dialog>
  )
}
