'use client'

import { cn } from '@/utils/ui'
import { Upload } from 'lucide-react'
import {
  type DragEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react'

type MediaLibraryDropzoneProps = {
  children: ReactNode
  className?: string
  disabled?: boolean
  dropLabel?: string
  dropDescription?: string
  onFileDrop: (files: FileList | null) => void
  onFilePaste?: (files: File[]) => void
}

const isFileDragEvent = (event: DragEvent<HTMLDivElement>) =>
  Array.from(event.dataTransfer?.types ?? []).includes('Files')

const getExtensionFromType = (type: string) => {
  const subtype = type.split('/')[1]?.split(';')[0]?.split('+').pop()

  return subtype ? `.${subtype}` : ''
}

// Pasted screenshots often arrive without a usable filename, which would make
// them fail the media source extension check.
const withPasteFilename = (file: File, index: number) => {
  if (file.name.includes('.')) {
    return file
  }

  const extension = getExtensionFromType(file.type)

  if (!extension) {
    return null
  }

  return new File([file], `pasted-${Date.now()}-${index}${extension}`, {
    type: file.type
  })
}

const getPastedFiles = (clipboardData: DataTransfer | null) => {
  const files = clipboardData?.files?.length
    ? Array.from(clipboardData.files)
    : Array.from(clipboardData?.items ?? [])
        .filter((item) => item.kind === 'file')
        .map((item) => item.getAsFile())
        .filter((file): file is File => Boolean(file))

  return files
    .map(withPasteFilename)
    .filter((file): file is File => Boolean(file))
}

export function MediaLibraryDropzone({
  children,
  className,
  disabled = false,
  dropLabel = 'Drop media to upload',
  dropDescription = 'Outstatic will upload up to 10 files you drop here.',
  onFileDrop,
  onFilePaste
}: MediaLibraryDropzoneProps) {
  const dragDepth = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)
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

  // Pasting is a document-level gesture, so it can only be observed by
  // listening on the document rather than on the dropzone itself.
  useEffect(() => {
    if (!onFilePaste || disabled) {
      return
    }

    const isPasteFromOtherDialog = (target: EventTarget | null) => {
      if (!(target instanceof Element)) {
        return false
      }

      const dialog = target.closest('[role="dialog"]')

      return Boolean(dialog) && !dialog?.contains(containerRef.current)
    }

    const handlePaste = (event: ClipboardEvent) => {
      if (isPasteFromOtherDialog(event.target)) {
        return
      }

      const files = getPastedFiles(event.clipboardData)

      if (files.length === 0) {
        return
      }

      event.preventDefault()
      onFilePaste(files)
    }

    document.addEventListener('paste', handlePaste)

    return () => {
      document.removeEventListener('paste', handlePaste)
    }
  }, [disabled, onFilePaste])

  return (
    <div
      ref={containerRef}
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
              <p className="font-medium text-foreground">{dropLabel}</p>
              <p className="text-sm text-muted-foreground">{dropDescription}</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
