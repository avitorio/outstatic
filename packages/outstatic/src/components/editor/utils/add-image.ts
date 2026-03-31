import { useFileStore } from '@/utils/hooks/use-file-store'
import { toast } from 'sonner'

export const addImage = (file: File) => {
  // check if the file is an image
  if (!file.type.includes('image/')) {
    console.error('File type not supported', {
      type: file.type,
      name: file.name
    })
    const errorToast = toast.error('File type not supported.', {
      action: {
        label: 'Copy Logs',
        onClick: () => {
          navigator.clipboard.writeText(
            `File: ${file.name}\nType: ${file.type}\n\nError: File type not supported. Only image files are allowed.`
          )
          toast.message('Logs copied to clipboard', {
            id: errorToast
          })
        }
      }
    })
    return

    // check if the file size is less than 20MB
  } else if (file.size / 1024 / 1024 > 20) {
    console.error('File size too big', { size: file.size, name: file.name })
    const errorToast = toast.error('File size too big (max 20MB).', {
      action: {
        label: 'Copy Logs',
        onClick: () => {
          navigator.clipboard.writeText(
            `File: ${file.name}\nSize: ${(file.size / 1024 / 1024).toFixed(
              2
            )}MB\n\nError: File size exceeds 20MB limit.`
          )
          toast.message('Logs copied to clipboard', {
            id: errorToast
          })
        }
      }
    })
    return
  }

  const blob = URL.createObjectURL(file)
  const reader = new FileReader()
  reader.readAsArrayBuffer(file)
  reader.onloadend = () => {
    const bytes = reader.result as string
    const buffer = Buffer.from(bytes, 'binary')
    useFileStore.getState().addFile({
      type: 'image',
      blob,
      filename: file.name,
      content: buffer.toString('base64')
    })
  }
  return blob
}
