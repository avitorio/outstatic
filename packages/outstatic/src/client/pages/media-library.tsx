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
  SquareCheck,
  X,
  Trash2
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
        (mediaFile) => mediaFile.__outstatic.path !== file.__outstatic.path
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
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [selectedMediaPaths, setSelectedMediaPaths] = useState<Set<string>>(
    new Set()
  )
  const [selectionAnchorPath, setSelectionAnchorPath] = useState<string | null>(
    null
  )
  const [hoveredMediaPath, setHoveredMediaPath] = useState<string | null>(null)
  const [isShiftPressed, setIsShiftPressed] = useState(false)
  const [selectedSourceName, setSelectedSourceName] = useState(
    ALL_MEDIA_SOURCE_VALUE
  )
  const previousSelectedMediaCount = useRef(0)
  const {
    basePath,
    media,
    repoOwner,
    repoSlug,
    repoBranch,
    session,
    mediaJsonPath
  } = useOutstatic()
  const mediaSources = useMemo(() => media ?? [], [media])
  const apiPath = `${basePath}${API_MEDIA_PATH}${repoOwner}/${repoSlug}/${repoBranch}/`
  const [notFoundFiles, setNotFoundFiles] = useState<Set<string>>(new Set())
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set())
  const { data, isLoading, refetch: refetchMedia } = useGetMediaFiles()
  const fetchOid = useOid()
  const mutation = useCreateCommit()

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

  const selectedMediaCount = selectedMediaPaths.size
  const selectedMediaLabel =
    selectedMediaCount === 1
      ? '1 Item Selected'
      : `${selectedMediaCount} Items Selected`

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Shift') {
        setIsShiftPressed(true)
      } else if (event.key === 'Escape') {
        setSelectedMediaPaths(new Set())
        setSelectionAnchorPath(null)
        setHoveredMediaPath(null)
      }
    }
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Shift') {
        setIsShiftPressed(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  useEffect(() => {
    if (previousSelectedMediaCount.current === 0 && selectedMediaCount === 1) {
      toast.info('Hold Shift and click to select many items at once')
    }

    previousSelectedMediaCount.current = selectedMediaCount
  }, [selectedMediaCount])

  const getSelectionRangePaths = useCallback(
    (path: string) => {
      const anchorPath =
        selectionAnchorPath && selectedMediaPaths.has(selectionAnchorPath)
          ? selectionAnchorPath
          : Array.from(selectedMediaPaths)[0]

      if (!anchorPath) {
        return [path]
      }

      const anchorIndex = filteredFiles.findIndex(
        (file) => file.__outstatic.path === anchorPath
      )
      const targetIndex = filteredFiles.findIndex(
        (file) => file.__outstatic.path === path
      )

      if (anchorIndex === -1 || targetIndex === -1) {
        return [path]
      }

      const start = Math.min(anchorIndex, targetIndex)
      const end = Math.max(anchorIndex, targetIndex)

      return filteredFiles
        .slice(start, end + 1)
        .map((file) => file.__outstatic.path)
    },
    [filteredFiles, selectedMediaPaths, selectionAnchorPath]
  )

  const rangePreviewPaths = useMemo(() => {
    if (!isShiftPressed || !hoveredMediaPath || selectedMediaCount === 0) {
      return new Set<string>()
    }

    return new Set(
      getSelectionRangePaths(hoveredMediaPath).filter(
        (path) => !selectedMediaPaths.has(path)
      )
    )
  }, [
    hoveredMediaPath,
    isShiftPressed,
    selectedMediaCount,
    selectedMediaPaths,
    getSelectionRangePaths
  ])

  const clearSelectedMedia = () => {
    setSelectedMediaPaths(new Set())
    setSelectionAnchorPath(null)
    setHoveredMediaPath(null)
  }

  const toggleSelectedMedia = (path: string, shiftKey: boolean) => {
    if (shiftKey && selectedMediaPaths.size > 0) {
      setSelectedMediaPaths(
        new Set([...selectedMediaPaths, ...getSelectionRangePaths(path)])
      )

      if (!selectionAnchorPath) {
        setSelectionAnchorPath(Array.from(selectedMediaPaths)[0] ?? path)
      }

      return
    }

    const next = new Set(selectedMediaPaths)
    const isSelected = next.has(path)

    if (isSelected) {
      next.delete(path)
    } else {
      next.add(path)
    }

    setSelectedMediaPaths(next)

    if (!isSelected && selectedMediaPaths.size === 0) {
      setSelectionAnchorPath(path)
    } else if (selectionAnchorPath === path && !next.has(path)) {
      setSelectionAnchorPath(Array.from(next)[0] ?? null)
    } else if (!selectionAnchorPath && next.size > 0) {
      setSelectionAnchorPath(Array.from(next)[0])
    }
  }

  const deleteSelectedMedia = async () => {
    const selectedPaths = Array.from(selectedMediaPaths)

    if (selectedPaths.length === 0) {
      return
    }

    setBulkDeleting(true)
    try {
      const [{ data: latestData }, oid] = await Promise.all([
        refetchMedia(),
        fetchOid()
      ])

      if (!latestData || !oid) {
        throw new Error('Failed to fetch media or oid')
      }

      const selectedPathSet = new Set(selectedPaths)
      const { media: mediaData, commitUrl } = latestData
      const mediaByPath = new Map(
        mediaData.media.map((mediaFile) => [
          mediaFile.__outstatic.path,
          mediaFile
        ])
      )
      const owner = repoOwner || session?.user?.login || ''
      const selectedCount = selectedPaths.length

      const capi = createCommitApi({
        message:
          selectedCount === 1
            ? `chore: remove ${mediaByPath.get(selectedPaths[0])?.filename ?? 'media file'}`
            : `chore: remove ${selectedCount} media files`,
        owner,
        oid,
        name: repoSlug,
        branch: repoBranch
      })

      selectedPaths.forEach((path) => {
        const mediaFile = mediaByPath.get(path)

        if (!mediaFile) {
          return
        }

        const isMissingImage =
          mediaFile.type === 'image' && notFoundFiles.has(path)

        if (!isMissingImage) {
          capi.removeFile(path)
        }
      })

      mediaData.generated = new Date().toISOString()
      mediaData.commit = hashFromUrl(commitUrl)
      const nextMedia = mediaData.media.filter(
        (mediaFile) => !selectedPathSet.has(mediaFile.__outstatic.path)
      )
      capi.replaceFile(
        mediaJsonPath,
        stringifyMedia({ ...mediaData, media: nextMedia })
      )

      const input = capi.createInput()
      const itemCopy = selectedCount === 1 ? 'item' : 'items'

      await toast.promise(mutation.mutateAsync(input), {
        loading: `Deleting ${selectedCount} media ${itemCopy}...`,
        success: `${selectedCount} media ${itemCopy} deleted successfully`,
        error: `Failed to delete media ${itemCopy}`
      })

      setShowBulkDeleteDialog(false)
      clearSelectedMedia()
      await refetchMedia()
    } catch (error) {
      console.log(error)
    } finally {
      setBulkDeleting(false)
    }
  }

  return (
    <AdminLayout title="Media Library" className="pt-0 md:pt-0">
      <div className="sticky top-0 z-10 bg-background pb-6 pt-10">
        {selectedMediaCount > 0 ? (
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Clear selected media"
                onClick={clearSelectedMedia}
                disabled={bulkDeleting}
              >
                <X className="size-4" />
              </Button>
              <h1 className="text-xl md:text-2xl">{selectedMediaLabel}</h1>
            </div>
            <Button
              type="button"
              variant="destructive"
              onClick={() => setShowBulkDeleteDialog(true)}
              disabled={bulkDeleting || isUploading}
            >
              <Trash2 className="size-4" />
              Delete Items
            </Button>
          </div>
        ) : (
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
        )}
        <MediaSettingsDialog
          showMediaPathDialog={showMediaSettingsDialog}
          setShowMediaPathDialog={setShowMediaSettingsDialog}
        />
        <AlertDialog
          open={showBulkDeleteDialog}
          onOpenChange={(open) => {
            if (!bulkDeleting) {
              setShowBulkDeleteDialog(open)
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Media Items</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {selectedMediaCount} selected
                media {selectedMediaCount === 1 ? 'item' : 'items'}?
                <br />
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={bulkDeleting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={bulkDeleting}
                onClick={(event) => {
                  event.preventDefault()
                  void deleteSelectedMedia()
                }}
                className="bg-destructive/10 text-destructive hover:bg-destructive/20"
              >
                {bulkDeleting ? (
                  <>
                    <SpinnerIcon className="mr-2 h-4 w-4" />
                    Deleting
                  </>
                ) : (
                  'Delete Items'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
              {filteredFiles.map((file) => {
                const isSelected = selectedMediaPaths.has(file.__outstatic.path)
                const isRangePreview = rangePreviewPaths.has(
                  file.__outstatic.path
                )

                return (
                  <div
                    key={file.__outstatic.path}
                    data-testid={`media-card-${file.filename}`}
                    data-selection-preview={isRangePreview ? 'true' : undefined}
                    onMouseEnter={(event) => {
                      setHoveredMediaPath(file.__outstatic.path)
                      setIsShiftPressed(event.shiftKey)
                    }}
                    onMouseLeave={(event) => {
                      if (!event.shiftKey) {
                        setHoveredMediaPath(null)
                      }
                    }}
                    className="group relative space-y-1 overflow-hidden rounded-lg bg-card"
                  >
                    <div
                      className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-md ${
                        isSelected ? 'bg-muted' : ''
                      } ${isRangePreview ? 'bg-black' : ''}`}
                    >
                      <div
                        onClick={(event) => {
                          if (event.shiftKey && !isUploading && !bulkDeleting) {
                            toggleSelectedMedia(file.__outstatic.path, true)
                          }
                        }}
                        className={`absolute inset-0 transition-all ${
                          isSelected ? 'scale-90' : 'scale-100'
                        } ${isRangePreview ? 'opacity-70' : 'opacity-100'}`}
                      >
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
                              onLoad={() =>
                                handleImageLoad(file.__outstatic.path)
                              }
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
                      </div>
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
                      <Button
                        type="button"
                        size="icon"
                        variant={isSelected ? 'default' : 'secondary'}
                        aria-pressed={isSelected}
                        aria-label={`${isSelected ? 'Deselect' : 'Select'} ${
                          file.filename
                        }`}
                        disabled={isUploading || bulkDeleting}
                        onClick={(event) => {
                          event.stopPropagation()
                          toggleSelectedMedia(
                            file.__outstatic.path,
                            event.shiftKey
                          )
                        }}
                        className={`absolute left-2 top-2 shadow-sm ${
                          isSelected
                            ? 'opacity-100'
                            : 'bg-background/80 opacity-0 backdrop-blur-sm group-hover:opacity-100 focus-visible:opacity-100'
                        }`}
                      >
                        <SquareCheck className="size-4" />
                      </Button>
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
                )
              })}
            </div>
          )}
        </MediaLibraryDropzone>
      )}
    </AdminLayout>
  )
}
