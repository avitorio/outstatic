import { useFileStore } from '@/utils/hooks/useFileStore'
import { toast } from 'sonner'

export const addImage = (file: Blob) => {
  // check if the file is an image
  if (!file.type.includes('image/')) {
    toast.error('File type not supported.')
    return

    // check if the file size is less than 20MB
  } else if (file.size / 1024 / 1024 > 20) {
    toast.error('File size too big (max 20MB).')
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
