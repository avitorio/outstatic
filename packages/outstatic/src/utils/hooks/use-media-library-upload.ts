'use client'

import { FileType } from '@/types'
import { toast } from 'sonner'
import { useCallback, useState } from 'react'
import useSubmitMedia from './use-submit-media'
import { MediaSourceConfig } from '../metadata/types'
import {
  getMediaTypeForFilename,
  isFilenameAllowedForSource,
  isImageOnlyMediaSource
} from '../media-config'

const MAX_MEDIA_UPLOAD_BATCH_FILES = 10
const MAX_MEDIA_FILE_SIZE_BYTES = 20 * 1024 * 1024

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
  unsupportedCount,
  oversizedCount,
  unreadableCount,
  unsupportedLabel
}: {
  unsupportedCount: number
  oversizedCount: number
  unreadableCount: number
  unsupportedLabel: string
}) => {
  const parts = [
    unsupportedCount > 0
      ? `${unsupportedCount} ${unsupportedLabel} ${pluralize(unsupportedCount, 'file')}`
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

const getUploadCopy = (source?: MediaSourceConfig) => {
  const imageOnly = source ? isImageOnlyMediaSource(source) : false

  return {
    singular: imageOnly ? 'image' : 'file',
    plural: imageOnly ? 'images' : 'files',
    unsupportedLabel: imageOnly ? 'invalid' : 'unsupported'
  }
}

export function useMediaLibraryUpload({
  source,
  sources = []
}: {
  source?: MediaSourceConfig
  sources?: MediaSourceConfig[]
} = {}) {
  const [isUploading, setIsUploading] = useState(false)
  const submitMedia = useSubmitMedia()

  const handleFileUpload = useCallback(
    async (files: FileList | File[] | null) => {
      const uploadSources = source ? [source] : sources

      if (uploadSources.length === 0) {
        return
      }

      const nextFiles = getFiles(files)
      const uploadCopy = getUploadCopy(source)

      if (nextFiles.length === 0) {
        return
      }

      if (nextFiles.length > MAX_MEDIA_UPLOAD_BATCH_FILES) {
        toast.error(
          `You can upload up to ${MAX_MEDIA_UPLOAD_BATCH_FILES} ${uploadCopy.plural} at once.`
        )
        return
      }

      const uploadCandidates: File[] = []
      const matchedSourcesByFilename = new Map<string, MediaSourceConfig>()
      let unsupportedCount = 0
      let oversizedCount = 0

      nextFiles.forEach((file) => {
        const matchedSource = uploadSources.find((uploadSource) =>
          isFilenameAllowedForSource(file.name, uploadSource)
        )

        if (!matchedSource) {
          unsupportedCount += 1
          return
        }

        if (file.size > MAX_MEDIA_FILE_SIZE_BYTES) {
          oversizedCount += 1
          return
        }

        matchedSourcesByFilename.set(file.name, matchedSource)
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
              type: getMediaTypeForFilename(
                file.name,
                matchedSourcesByFilename.get(file.name)
              ),
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
          unsupportedCount,
          oversizedCount,
          unreadableCount,
          unsupportedLabel: uploadCopy.unsupportedLabel
        })

        if (mediaFiles.length === 0) {
          toast.error(
            skippedSummary
              ? `No ${uploadCopy.plural} were uploaded. ${skippedSummary}`
              : `No ${uploadCopy.plural} were uploaded.`
          )
          return
        }

        const uploadCount = mediaFiles.length
        const uploadLabel = pluralize(
          uploadCount,
          uploadCopy.singular,
          uploadCopy.plural
        )
        const filesBySource = new Map<
          string,
          { source: MediaSourceConfig; files: FileType[] }
        >()

        mediaFiles.forEach((mediaFile) => {
          const matchedSource = matchedSourcesByFilename.get(mediaFile.filename)

          if (!matchedSource) {
            return
          }

          const group = filesBySource.get(matchedSource.name) ?? {
            source: matchedSource,
            files: []
          }
          group.files.push(mediaFile)
          filesBySource.set(matchedSource.name, group)
        })
        const uploadPromise = (async () => {
          for (const group of filesBySource.values()) {
            await submitMedia({
              files: group.files,
              source: group.source
            })
          }
        })()

        await toast.promise(uploadPromise, {
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
    [source, sources, submitMedia]
  )

  return {
    handleFileUpload,
    isUploading
  }
}
