'use client'

import { FileType } from '@/types'
import { toast } from 'sonner'
import { useCallback, useState } from 'react'
import useSubmitMedia from './use-submit-media'

const MAX_MEDIA_UPLOAD_BATCH_FILES = 10
const MAX_MEDIA_FILE_SIZE_BYTES = 20 * 1024 * 1024
const IMAGE_FILE_EXTENSION =
  /\.(avif|bmp|gif|heic|heif|jpe?g|png|svg|tiff?|webp)$/i

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Unable to parse file contents.'))
        return
      }

      resolve(reader.result)
    }

    reader.onerror = () => {
      reject(reader.error ?? new Error('Unable to read file contents.'))
    }

    reader.readAsDataURL(file)
  })

const isImageFile = (file: File) =>
  file.type.startsWith('image/') || IMAGE_FILE_EXTENSION.test(file.name)

const getFiles = (files: FileList | File[] | null) => {
  if (!files) {
    return []
  }

  return Array.from(files)
}

const pluralize = (count: number, singular: string, plural = `${singular}s`) =>
  count === 1 ? singular : plural

const joinWithAnd = (parts: string[]) => {
  if (parts.length <= 1) {
    return parts[0] ?? ''
  }

  if (parts.length === 2) {
    return `${parts[0]} and ${parts[1]}`
  }

  return `${parts.slice(0, -1).join(', ')}, and ${parts.at(-1)}`
}

const createSkippedSummary = ({
  invalidCount,
  oversizedCount,
  unreadableCount
}: {
  invalidCount: number
  oversizedCount: number
  unreadableCount: number
}) => {
  const parts = [
    invalidCount > 0
      ? `${invalidCount} invalid ${pluralize(invalidCount, 'file')}`
      : null,
    oversizedCount > 0
      ? `${oversizedCount} oversized ${pluralize(oversizedCount, 'file')}`
      : null,
    unreadableCount > 0
      ? `${unreadableCount} unreadable ${pluralize(unreadableCount, 'file')}`
      : null
  ].filter((part): part is string => Boolean(part))

  if (parts.length === 0) {
    return ''
  }

  return `Skipped ${joinWithAnd(parts)}.`
}

export function useMediaLibraryUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const submitMedia = useSubmitMedia()

  const handleFileUpload = useCallback(
    async (files: FileList | File[] | null) => {
      const nextFiles = getFiles(files)

      if (nextFiles.length === 0) {
        return
      }

      if (nextFiles.length > MAX_MEDIA_UPLOAD_BATCH_FILES) {
        toast.error(
          `You can upload up to ${MAX_MEDIA_UPLOAD_BATCH_FILES} images at once.`
        )
        return
      }

      const uploadCandidates: File[] = []
      let invalidCount = 0
      let oversizedCount = 0

      nextFiles.forEach((file) => {
        if (!isImageFile(file)) {
          invalidCount += 1
          return
        }

        if (file.size > MAX_MEDIA_FILE_SIZE_BYTES) {
          oversizedCount += 1
          return
        }

        uploadCandidates.push(file)
      })

      try {
        setIsUploading(true)

        const readResults = await Promise.allSettled(
          uploadCandidates.map(async (file) => {
            const fileContents = await readFileAsDataUrl(file)
            const content = fileContents.split(',')[1]

            if (!content) {
              throw new Error('Unable to parse file contents.')
            }

            return {
              filename: file.name,
              type: 'image',
              content
            } satisfies FileType
          })
        )

        const mediaFiles: FileType[] = []
        let unreadableCount = 0

        readResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            mediaFiles.push(result.value)
            return
          }

          unreadableCount += 1
          console.error(
            `Failed to read media file "${uploadCandidates[index]?.name}"`,
            result.reason
          )
        })

        const skippedSummary = createSkippedSummary({
          invalidCount,
          oversizedCount,
          unreadableCount
        })

        if (mediaFiles.length === 0) {
          toast.error(
            skippedSummary
              ? `No images were uploaded. ${skippedSummary}`
              : 'No images were uploaded.'
          )
          return
        }

        const uploadCount = mediaFiles.length
        const uploadLabel = pluralize(uploadCount, 'image')

        await toast.promise(submitMedia(mediaFiles), {
          loading: `Uploading ${uploadCount} ${uploadLabel}...`,
          success: skippedSummary
            ? `Uploaded ${uploadCount} ${uploadLabel}. ${skippedSummary}`
            : `Uploaded ${uploadCount} ${uploadLabel}.`,
          error: `Failed to upload ${uploadCount} ${uploadLabel}.`
        })
      } catch (error) {
        console.error('Failed to upload media', error)
      } finally {
        setIsUploading(false)
      }
    },
    [submitMedia]
  )

  return {
    handleFileUpload,
    isUploading
  }
}
