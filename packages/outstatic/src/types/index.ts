import { Editor } from '@tiptap/react'

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
  type: 'image'
  blob?: string
  filename: string
  content: string
}

export type DocumentContextType = {
  editor: Editor
  document: Document
  editDocument: (property: string, value: any) => void
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

export const customFieldTypes = ['String', 'Text', 'Number', 'Tags'] as const
export const customFieldData = ['string', 'number', 'array'] as const

export type CustomFieldArrayValue = {
  label: string
  value: string
}

export type CustomField<T extends 'string' | 'number' | 'array'> = {
  title: string
  fieldType: (typeof customFieldTypes)[number]
  dataType: T
  description?: string
  required?: boolean
} & (T extends 'array' ? { values: CustomFieldArrayValue[] } : {})

export type CustomFields = {
  [key: string]: CustomField<'string' | 'number' | 'array'>
}

export type SchemaShape =
  | Document
  | {
      [key: string]: any
    }

export function isArrayCustomField(obj: any): obj is CustomField<'array'> {
  return obj && obj.dataType === 'array' && Array.isArray(obj.values)
}
