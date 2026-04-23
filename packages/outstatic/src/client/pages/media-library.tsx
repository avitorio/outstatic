'use client'

import { AdminLayout } from '@/components/admin-layout'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/shadcn/alert-dialog'
import { Button } from '@/components/ui/shadcn/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/shadcn/dropdown-menu'
import { MediaSettings } from '@/client/pages/settings/_components/media-settings'
import { MediaLibraryDropzone } from '@/components/ui/outstatic/media-library-dropzone'
import {
  ALL_MEDIA_SOURCE_VALUE,
  MediaLibraryHeader
} from '@/components/ui/outstatic/media-library-header'
import { MediaSettingsDialog } from '@/components/ui/outstatic/media-settings-dialog'
import { SpinnerIcon } from '@/components/ui/outstatic/spinner-icon'
import { Card, CardContent } from '@/components/ui/shadcn/card'
import { API_MEDIA_PATH } from '@/utils/constants'
import { createCommitApi } from '@/utils/create-commit-api'
import { hashFromUrl } from '@/utils/hash-from-url'
import { useCreateCommit } from '@/utils/hooks/use-create-commit'
import { useGetMediaFiles } from '@/utils/hooks/use-get-media-files'
import { useMediaLibraryUpload } from '@/utils/hooks/use-media-library-upload'
import useOid from '@/utils/hooks/use-oid'
import { useOutstatic } from '@/utils/hooks/use-outstatic'
import {
  buildPublicMediaPath,
  getMediaSourceForItem
} from '@/utils/media-config'
import { stringifyMedia } from '@/utils/metadata/stringify'
import { MediaItem, MediaSourceConfig } from '@/utils/metadata/types'
import {
  Copy,
  ExternalLink,
  FileQuestion,
  FileText,
  ImageOff,
  MoreHorizontalIcon,
  Trash2
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

function MediaItemActions({
  file,
  media,
  disabled,
  notFound,
  onComplete
}: {
  file: MediaItem
  media: MediaSourceConfig[]
  disabled: boolean
  notFound: boolean
  onComplete: () => Promise<void>
}) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { repoOwner, repoSlug, repoBranch, session, mediaJsonPath } =
    useOutstatic()
  const fetchOid = useOid()
  const mutation = useCreateCommit()
  const { refetch: refetchMedia } = useGetMediaFiles({ enabled: false })

  const source = getMediaSourceForItem(file, media)
  const githubUrl = `https://github.com/${repoOwner}/${repoSlug}/blob/${repoBranch}/${file.__outstatic.path}`
  const outputPath = source
    ? buildPublicMediaPath(source, file.filename)
    : file.__outstatic.path

  const copyOutputPath = async () => {
    try {
      await navigator.clipboard.writeText(outputPath)
      toast.success('Output copied')
    } catch {
      toast.error('Failed to copy output')
    }
  }

  const deleteMedia = async () => {
    setDeleting(true)
    try {
      const [{ data }, oid] = await Promise.all([refetchMedia(), fetchOid()])

      if (!data || !oid) {
        throw new Error('Failed to fetch media or oid')
      }

      const { media: mediaData, commitUrl } = data
      const owner = repoOwner || session?.user?.login || ''

      const capi = createCommitApi({
        message: `chore: remove ${file.filename}`,
        owner,
        oid,
        name: repoSlug,
        branch: repoBranch
      })

      if (!notFound) {
        capi.removeFile(file.__outstatic.path)
      }

      mediaData.generated = new Date().toISOString()
      mediaData.commit = hashFromUrl(commitUrl)
      const nextMedia = mediaData.media.filter(
        (mediaFile) => mediaFile.filename !== file.filename
      )
      capi.replaceFile(
        mediaJsonPath,
        stringifyMedia({ ...mediaData, media: nextMedia })
      )

      const input = capi.createInput()

      await toast.promise(mutation.mutateAsync(input), {
        loading: 'Deleting media...',
        success: 'Media deleted successfully',
        error: 'Failed to delete media'
      })

      setShowDeleteDialog(false)
      await onComplete()
    } catch (error) {
      console.log(error)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            disabled={disabled}
            variant="secondary"
            size="icon"
            className="absolute right-2 top-2 bg-background/80 opacity-0 shadow-sm backdrop-blur-sm group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
          >
            <span className="sr-only">Open media actions</span>
            <MoreHorizontalIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() =>
              window.open(githubUrl, '_blank', 'noopener,noreferrer')
            }
          >
            <ExternalLink />
            Open in GitHub
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => void copyOutputPath()}>
            <Copy />
            Copy output
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={(event) => {
              event.preventDefault()
              setShowDeleteDialog(true)
            }}
          >
            <Trash2 />
            Delete File
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Media</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this media file?
              <br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void deleteMedia()}
              className="bg-destructive/10 text-destructive hover:bg-destructive/20"
            >
              {deleting ? (
                <>
                  <SpinnerIcon className="mr-2 h-4 w-4" />
                  Deleting
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default function MediaLibrary() {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [sortDirection, setSortDirection] = useState('desc')
  const [showMediaSettingsDialog, setShowMediaSettingsDialog] = useState(false)
  const [selectedSourceName, setSelectedSourceName] = useState(
    ALL_MEDIA_SOURCE_VALUE
  )
  const { basePath, media, repoOwner, repoSlug, repoBranch } = useOutstatic()
  const mediaSources = media ?? []
  const apiPath = `${basePath}${API_MEDIA_PATH}${repoOwner}/${repoSlug}/${repoBranch}/`
  const [notFoundFiles, setNotFoundFiles] = useState<Set<string>>(new Set())
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set())
  const { data, isLoading, refetch: refetchMedia } = useGetMediaFiles()

  const selectedSource =
    selectedSourceName === ALL_MEDIA_SOURCE_VALUE
      ? undefined
      : mediaSources.find((source) => source.name === selectedSourceName)
  const { handleFileUpload, isUploading } = useMediaLibraryUpload({
    source: selectedSource,
    sources: mediaSources
  })

  const filteredFiles = useMemo(() => {
    if (!data) return []

    return data.media.media
      .filter((file) => {
        if (selectedSourceName === ALL_MEDIA_SOURCE_VALUE) {
          return true
        }

        return (
          getMediaSourceForItem(file, mediaSources)?.name === selectedSourceName
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
  }, [
    data,
    mediaSources,
    searchTerm,
    selectedSourceName,
    sortBy,
    sortDirection
  ])

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
          mediaSources={mediaSources}
          selectedSourceName={selectedSourceName}
          setSelectedSourceName={setSelectedSourceName}
          handleFileUpload={handleFileUpload}
          onOpenSettings={() => setShowMediaSettingsDialog(true)}
          disableUpload={!mediaSources.length}
        />
        <MediaSettingsDialog
          showMediaPathDialog={showMediaSettingsDialog}
          setShowMediaPathDialog={setShowMediaSettingsDialog}
        />
      </div>
      {!mediaSources.length ? (
        <div className="max-w-lg">
          <Card>
            <CardContent>
              <MediaSettings />
            </CardContent>
          </Card>
        </div>
      ) : (
        <MediaLibraryDropzone
          className="min-h-[50vh] h-[calc(100vh-240px)]"
          disabled={isUploading}
          dropLabel="Drop media to upload"
          dropDescription="Outstatic will upload up to 10 files you drop here."
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
                No media files available for this source. Upload some files or
                drop media here to get started.
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
                    {file.type === 'image' &&
                    !notFoundFiles.has(file.__outstatic.path) ? (
                      <>
                        {loadingImages.has(file.__outstatic.path) ? (
                          <div className="absolute inset-0 flex items-center justify-center rounded-md bg-gray-50">
                            <SpinnerIcon />
                          </div>
                        ) : null}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`${apiPath}${file.__outstatic.path}`}
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
                    ) : file.type === 'image' ? (
                      <div className="absolute inset-0 flex items-center justify-center rounded-md bg-red-100/50">
                        <ImageOff className="h-12 w-12 text-red-500" />
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-md bg-slate-50 px-4 text-center">
                        <FileText className="h-12 w-12 text-slate-500" />
                        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          {file.type}
                        </span>
                      </div>
                    )}
                    <MediaItemActions
                      file={file}
                      media={mediaSources}
                      disabled={isUploading}
                      onComplete={async () => {
                        await refetchMedia()
                      }}
                      notFound={
                        file.type === 'image' &&
                        notFoundFiles.has(file.__outstatic.path)
                      }
                    />
                  </div>
                  <div className="relative pb-4">
                    <div className="flex items-center justify-between">
                      <h3 className="truncate text-sm font-semibold">
                        {file.filename}
                      </h3>
                    </div>
                    {mediaSources.length > 1 ? (
                      <p className="truncate text-xs text-muted-foreground">
                        {getMediaSourceForItem(file, mediaSources)?.label ??
                          'Unknown source'}
                      </p>
                    ) : null}
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
