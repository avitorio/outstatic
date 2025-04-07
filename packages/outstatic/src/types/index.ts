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
  setHasChanges: (hasChanges: boolean) => void
  collection: string
  extension: MDExtensions
}

export type Session = {
  user: {
    name: string
    login: string
    email: string
    image: string
  }
  access_token: string
  refresh_token?: string
  expires: Date
}

export type Collection = {
  name: string
  contentPath?: string
}

export type DeepNonNullable<T> = {
  [P in keyof T]-?: DeepNonNullable<NonNullable<T[P]>>
}

export const customFieldTypes = [
  'String',
  'Text',
  'Number',
  'Tags',
  'Boolean',
  'Date',
  'Image'
] as const

export const customFieldData = [
  'string',
  'number',
  'array',
  'boolean',
  'date',
  'image'
] as const

export type CustomFieldArrayValue = {
  label: string
  value: string
}

export type CustomFieldType<
  T extends 'string' | 'number' | 'array' | 'boolean' | 'date' | 'image'
> = {
  title: string
  fieldType: (typeof customFieldTypes)[number]
  dataType: T
  description?: string
  required?: boolean
} & (T extends 'array' ? { values: CustomFieldArrayValue[] } : {})

export type CustomFieldsType = {
  [key: string]: CustomFieldType<
    'string' | 'number' | 'array' | 'boolean' | 'date' | 'image'
  >
}

export type DocumentSchemaShape =
  | Document
  | {
      [key: string]: any
    }

export function isArrayCustomField(obj: any): obj is CustomFieldType<'array'> {
  return obj && obj.dataType === 'array' && Array.isArray(obj.values)
}

export type MDExtensions = 'md' | 'mdx'
