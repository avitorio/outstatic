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
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from '@/components/ui/shadcn/alert-dialog'
import { MediaItem } from '@/utils/metadata/types'
import { toast } from 'sonner'
import { TrashIcon } from 'lucide-react'
import useSubmitMedia from '@/utils/hooks/useSubmitMedia'
import { FileType } from '@/types'

export default function MediaLibrary() {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [sortDirection, setSortDirection] = useState('desc')
  const [fileType, setFileType] = useState('all')
  const [selectedFiles, setSelectedFiles] = useState<MediaItem[]>([])
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const { basePath, repoOwner, repoSlug, repoBranch, session, gqlClient } =
    useOutstatic()
  const apiPath = `${basePath}${API_MEDIA_PATH}${repoOwner}/${repoSlug}/${repoBranch}/`
  const { data, isLoading, error } = useGetMediaFiles()
  const filteredFiles = useMemo(() => {
    if (!data) return []

    return data.media.media
      .filter((file) => {
        if (
          file.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
          file.alt.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          if (fileType === 'all' || file.type === fileType) {
            return true
          }
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
  }, [data, searchTerm, sortBy, sortDirection, fileType])

  const handleFileSelect = (file: MediaItem) => {
    if (selectedFiles.includes(file)) {
      setSelectedFiles(
        selectedFiles.filter((f) => f.filename !== file.filename)
      )
    } else {
      setSelectedFiles([...selectedFiles, file])
    }
  }

  const handleAltEdit = (file, newAlt) => {
    const updatedFiles = files.map((f) =>
      f.filename === file.filename ? { ...f, alt: newAlt } : f
    )
    // setFiles(updatedFiles)
    toast.success('Alt tag updated')
  }
  const handleFileDelete = () => {
    setIsDeleteModalOpen(true)
  }
  const handleDeleteConfirm = () => {
    const updatedFiles = files.filter((file) => !selectedFiles.includes(file))
    // setFiles(updatedFiles)
    setSelectedFiles([])
    setIsDeleteModalOpen(false)
    toast.success('Files deleted successfully')
  }
  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false)
  }

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
        <div className="mb-8 flex h-12 items-center capitalize gap-4">
          <h1 className="mr-12 text-2xl">Media Library</h1>
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
          <Select
            value={fileType}
            className="w-40"
            onValueChange={(value) => setFileType(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="File type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="video">Videos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div
        className="grid gap-6 sm:grid-cols-4 md:grid-cols-8"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          handleFileUpload(e.dataTransfer.files)
        }}
      >
        {filteredFiles.map((file) => (
          <div
            key={file.filename}
            className={`space-y-1 bg-card rounded-lg overflow-hidden cursor-pointer group relative ${
              selectedFiles.includes(file) ? 'border border-slate-200' : ''
            }`}
            onClick={(e) => {
              if (e.target.tagName !== 'INPUT') {
                handleFileSelect(file)
              }
            }}
          >
            <div className="aspect-square">
              <img
                src={`${apiPath}${file.filename}`}
                alt={file.alt}
                className="w-full h-full object-cover object-center rounded-md"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-white/50"
                onClick={(e) => {
                  e.stopPropagation()
                  handleFileDelete()
                }}
              >
                <TrashIcon className="w-5 h-5" />
              </Button>
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
      {selectedFiles.length > 0 && (
        <div className="fixed bottom-4 left-4 bg-card p-4 rounded-lg shadow-lg flex items-center gap-4">
          <span>
            {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}
            selected
          </span>
          <Button
            variant="destructive"
            onClick={() => setIsDeleteModalOpen(true)}
          >
            Delete
          </Button>
        </div>
      )}
      <AlertDialog
        open={isDeleteModalOpen}
        onOpenChange={(open) => setIsDeleteModalOpen(open)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedFiles.length > 1
                ? 'Delete selected files?'
                : 'Delete this file?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected file(s) will be
              permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  )
}
