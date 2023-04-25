import { Editor } from '@tiptap/react'
import { Dispatch, SetStateAction } from 'react'

export type Document = {
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

export type DocumentContextType = {
  editor: Editor
  document: Document
  editDocument: (property: string, value: any) => void
  files: FileType[]
  setFiles: Dispatch<SetStateAction<FileType[]>>
  hasChanges: boolean
  collection: string
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

export type Collection = {
  name: string
}

export type DeepNonNullable<T> = {
  [P in keyof T]-?: DeepNonNullable<NonNullable<T[P]>>
}

export const customFieldTypes = ['String', 'Text'] as const
export const customFieldData = ['string'] as const

export type CustomField = {
  title: string
  fieldType: typeof customFieldTypes[number]
  dataType: typeof customFieldData[number]
  description?: string
  required?: boolean
}

export type CustomFields = {
  [key: string]: CustomField
}

export type SchemaShape =
  | Document
  | {
      [key: string]: any
    }
