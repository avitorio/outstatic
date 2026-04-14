'use client'

import { FileType } from '@/types'
import { toast } from 'sonner'
import { useCallback, useState } from 'react'
import useSubmitMedia from './use-submit-media'

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

const getFirstFile = (files: FileList | File[] | null) => {
  if (!files) {
    return null
  }

  return Array.from(files)[0] ?? null
}

export function useMediaLibraryUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const submitMedia = useSubmitMedia()

  const handleFileUpload = useCallback(
    async (files: FileList | File[] | null) => {
      const file = getFirstFile(files)

      if (!file) {
        return
      }

      if (!isImageFile(file)) {
        toast.error('Only image files can be uploaded.')
        return
      }

      if (file.size > MAX_MEDIA_FILE_SIZE_BYTES) {
        toast.error('File size too big (max 20MB).')
        return
      }

      let uploadStarted = false

      try {
        setIsUploading(true)
        const fileContents = await readFileAsDataUrl(file)
        const content = fileContents.split(',')[1]

        if (!content) {
          throw new Error('Unable to parse file contents.')
        }

        const mediaFile: FileType = {
          filename: file.name,
          type: 'image',
          content
        }

        uploadStarted = true

        await toast.promise(submitMedia(mediaFile), {
          loading: 'Uploading media...',
          success: 'Media uploaded successfully',
          error: `Failed to upload ${file.name}.`
        })
      } catch (error) {
        console.error('Failed to upload media', error)

        if (!uploadStarted) {
          toast.error(`Failed to read ${file.name}.`)
        }
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
