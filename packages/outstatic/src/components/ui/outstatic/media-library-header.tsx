import { Button } from '@/components/ui/shadcn/button'
import { Input } from '@/components/ui/shadcn/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/shadcn/select'
import { Settings } from 'lucide-react'
import { useId } from 'react'

interface MediaLibraryHeaderProps {
  isUploading: boolean
  searchTerm: string
  setSearchTerm: (value: string) => void
  sortBy: string
  setSortBy: (value: string) => void
  sortDirection: string
  setSortDirection: (value: string) => void
  handleFileUpload: (files: FileList | File[] | null) => void
  onOpenSettings: () => void
  disableUpload?: boolean
}

export function MediaLibraryHeader({
  isUploading,
  searchTerm,
  setSearchTerm,
  sortBy,
  setSortBy,
  sortDirection,
  setSortDirection,
  handleFileUpload,
  onOpenSettings,
  disableUpload = false
}: MediaLibraryHeaderProps) {
  const fileInputId = useId()

  return (
    <div className="flex items-center justify-between">
      <div className="flex h-12 items-center capitalize gap-4 xl:gap-12">
        <h1 className="text-xl md:text-2xl">Media Library</h1>
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
        </div>
        <input
          id={fileInputId}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          disabled={isUploading || disableUpload}
          onChange={(e) => {
            handleFileUpload(e.target.files)
            e.currentTarget.value = ''
          }}
        />
      </div>
      <div className="flex items-center gap-4">
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
