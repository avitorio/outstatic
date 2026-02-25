import { FileType } from '@/types'
import { create } from 'zustand'

type FileStore = {
  files: FileType[]
  addFile: (file: FileType) => void
  removeFile: (id: string) => void // or number, depending on your 'id' type in FileType
}

export const useFileStore = create<FileStore>((set) => ({
  // Initial state
  files: [],

  // Add file function
  addFile: (file) => set((state) => ({ files: [...state.files, file] })),

  // Remove file function
  removeFile: (blob) =>
    set((state) => ({
      files: state.files.filter((file) => file.blob !== blob)
    }))
}))
