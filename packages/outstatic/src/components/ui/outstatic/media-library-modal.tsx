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
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [sortDirection, setSortDirection] = useState('desc')
  const [selectedImage, setSelectedImage] = useState<MediaItem | null>(null)

  const {
    basePath,
    repoOwner,
    repoSlug,
    repoBranch,
    repoMediaPath,
    publicMediaPath
  } = useOutstatic()
  const apiPath = `${basePath}${API_MEDIA_PATH}${repoOwner}/${repoSlug}/${repoBranch}/`
  const { data, isLoading, refetch } = useGetMediaFiles()
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
              handleFileUpload={handleFileUpload}
              disableUpload={!repoMediaPath || !publicMediaPath}
            />
          </div>
        </DialogHeader>
        {!repoMediaPath || !publicMediaPath ? (
          <div className="flex h-full w-full items-center justify-center">
            <div className="mb-12 max-w-lg">
              <Card>
                <CardHeader>
                  <CardTitle>First time here?</CardTitle>
                  <CardBodyDescription>
                    It seems you haven&apos;t set up your media paths yet.
                    Let&apos;s do that!
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
                  No media files available. Upload some files or drop an image
                  here to get started!
                </p>
              </div>
            ) : (
              <div className="flex h-full max-h-[calc(100%-80px)] flex-col justify-between">
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
                            disabled={false}
                            onComplete={() => refetch()}
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
