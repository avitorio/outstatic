import { Button } from '@/components/ui/shadcn/button'
import { Input } from '@/components/ui/shadcn/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/shadcn/select'
import { MediaSourceConfig } from '@/utils/metadata/types'
import {
  createAcceptAttribute,
  getAllowedExtensionsForSource
} from '@/utils/media-config'
import { Settings } from 'lucide-react'
import { useId } from 'react'

export const ALL_MEDIA_SOURCE_VALUE = '__all_media__'

interface MediaLibraryHeaderProps {
  isUploading: boolean
  searchTerm: string
  setSearchTerm: (value: string) => void
  sortBy: string
  setSortBy: (value: string) => void
  sortDirection: string
  setSortDirection: (value: string) => void
  mediaSources?: MediaSourceConfig[]
  selectedSourceName?: string
  setSelectedSourceName?: (value: string) => void
  handleFileUpload: (files: FileList | File[] | null) => void
  onOpenSettings?: () => void
  disableUpload?: boolean
  showAllMediaOption?: boolean
}

export function MediaLibraryHeader({
  isUploading,
  searchTerm,
  setSearchTerm,
  sortBy,
  setSortBy,
  sortDirection,
  setSortDirection,
  mediaSources = [],
  selectedSourceName,
  setSelectedSourceName,
  handleFileUpload,
  onOpenSettings,
  disableUpload = false,
  showAllMediaOption = true
}: MediaLibraryHeaderProps) {
  const fileInputId = useId()
  const selectedSource = mediaSources.find(
    (source) => source.name === selectedSourceName
  )
  const accept = selectedSource
    ? createAcceptAttribute(selectedSource)
    : Array.from(
        new Set(
          mediaSources.flatMap((source) =>
            getAllowedExtensionsForSource(source)
          )
        )
      )
        .map((extension) => `.${extension}`)
        .join(',')

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-3 xl:gap-4">
        <h1 className="text-xl md:text-2xl">Media Library</h1>
        {mediaSources.length > 0 ? (
          <Select
            value={selectedSourceName}
            onValueChange={(value) => setSelectedSourceName?.(value)}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select a source" />
            </SelectTrigger>
            <SelectContent>
              {showAllMediaOption ? (
                <SelectItem value={ALL_MEDIA_SOURCE_VALUE}>
                  All Media
                </SelectItem>
              ) : null}
              {mediaSources.map((source) => (
                <SelectItem key={source.name} value={source.name}>
                  {source.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            asChild={!disableUpload}
            className="hover:cursor-pointer"
            disabled={isUploading || disableUpload}
          >
            {!disableUpload ? (
              <label htmlFor={fileInputId}>
                {isUploading ? 'Uploading...' : 'Add Media'}
              </label>
            ) : (
              'Add Media'
            )}
          </Button>
          {onOpenSettings ? (
            <Button
              size="icon"
              variant="ghost"
              type="button"
              title="Open media settings"
              aria-label="Open media settings"
              onClick={onOpenSettings}
            >
              <Settings className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
        <input
          id={fileInputId}
          type="file"
          accept={accept}
          multiple
          className="hidden"
          disabled={isUploading || disableUpload}
          onChange={(e) => {
            handleFileUpload(e.target.files)
            e.currentTarget.value = ''
          }}
        />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Input
          placeholder="Search files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="xl:w-64"
        />
        <div className="hidden md:block">
          <Select value={sortBy} onValueChange={(value) => setSortBy(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="hidden md:block">
          <Select
            value={sortDirection}
            onValueChange={(value) => setSortDirection(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort direction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">
                {sortBy === 'date' ? 'Oldest' : 'Ascending'}
              </SelectItem>
              <SelectItem value="desc">
                {sortBy === 'date' ? 'Newest' : 'Descending'}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
