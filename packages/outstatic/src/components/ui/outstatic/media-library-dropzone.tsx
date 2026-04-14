'use client'

import { cn } from '@/utils/ui'
import { Upload } from 'lucide-react'
import {
  type DragEvent,
  type ReactNode,
  useCallback,
  useRef,
  useState
} from 'react'

type MediaLibraryDropzoneProps = {
  children: ReactNode
  className?: string
  disabled?: boolean
  onFileDrop: (files: FileList | null) => void
}

const isFileDragEvent = (event: DragEvent<HTMLDivElement>) =>
  Array.from(event.dataTransfer?.types ?? []).includes('Files')

export function MediaLibraryDropzone({
  children,
  className,
  disabled = false,
  onFileDrop
}: MediaLibraryDropzoneProps) {
  const dragDepth = useRef(0)
  const [isDragging, setIsDragging] = useState(false)

  const handleDragEnter = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      if (!isFileDragEvent(event)) {
        return
      }

      event.preventDefault()

      if (disabled) {
        return
      }

      dragDepth.current += 1
      setIsDragging(true)
    },
    [disabled]
  )

  const handleDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      if (!isFileDragEvent(event)) {
        return
      }

      event.preventDefault()

      if (disabled) {
        event.dataTransfer.dropEffect = 'none'
        return
      }

      event.dataTransfer.dropEffect = 'copy'
    },
    [disabled]
  )

  const handleDragLeave = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      if (!isFileDragEvent(event)) {
        return
      }

      event.preventDefault()

      if (disabled) {
        dragDepth.current = 0
        setIsDragging(false)
        return
      }

      dragDepth.current = Math.max(dragDepth.current - 1, 0)

      if (dragDepth.current === 0) {
        setIsDragging(false)
      }
    },
    [disabled]
  )

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      if (!isFileDragEvent(event)) {
        return
      }

      event.preventDefault()
      dragDepth.current = 0
      setIsDragging(false)

      if (disabled) {
        return
      }

      onFileDrop(event.dataTransfer.files)
    },
    [disabled, onFileDrop]
  )

  return (
    <div
      data-testid="media-library-dropzone"
      className={cn(
        'relative rounded-xl transition-colors',
        isDragging && 'bg-primary/5',
        className
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}
      {isDragging ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-xl border-2 border-dashed border-primary bg-background/90 p-6 text-center">
          <div className="space-y-3">
            <Upload className="mx-auto size-8 text-primary" />
            <div className="space-y-1">
              <p className="font-medium text-foreground">
                Drop images to upload
              </p>
              <p className="text-sm text-muted-foreground">
                Outstatic will upload up to 10 images you drop here.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
