import { Editor } from '@tiptap/react'
import { Dispatch, SetStateAction } from 'react'

export type Content = {
  author: {
    name?: string
    picture?: string
  }
  title: string
  publishedAt: Date
  content: string
  status: 'published' | 'draft'
  slug: string
  description?: string
  coverImage?: string
}

export type FileType = {
  type: 'images'
  blob?: string
  filename: string
  content: string
}

export type PostContextType = {
  editor: Editor
  post: Content
  editPost: (property: string, value: any) => void
  files: FileType[]
  setFiles: Dispatch<SetStateAction<FileType[]>>
  hasChanges: boolean
  contentType: string
}

export type Session = {
  user: {
    name: string
    login: string
    email: string
    image: string
  }
  access_token: string
  expires: Date
}

export type ContentType = {
  name: string
}
