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
  'Select',
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

export type CustomFieldDefinitionInput = {
  title: string
  fieldType: (typeof customFieldTypes)[number]
  description?: string
  required?: boolean
  values?: CustomFieldArrayValue[]
}

type BaseCustomField<
  TFieldType extends (typeof customFieldTypes)[number],
  TDataType extends (typeof customFieldData)[number]
> = {
  title: string
  fieldType: TFieldType
  dataType: TDataType
  description?: string
  required?: boolean
}

export type StringCustomField = BaseCustomField<'String', 'string'>

export type TextCustomField = BaseCustomField<'Text', 'string'>

export type NumberCustomField = BaseCustomField<'Number', 'number'>

export type SelectCustomField = BaseCustomField<'Select', 'string'> & {
  values: CustomFieldArrayValue[]
}

export type TagsCustomField = BaseCustomField<'Tags', 'array'> & {
  values: CustomFieldArrayValue[]
}

export type BooleanCustomField = BaseCustomField<'Boolean', 'boolean'>

export type DateCustomField = BaseCustomField<'Date', 'date'>

export type ImageCustomField = BaseCustomField<'Image', 'image'>

export type CustomFieldType =
  | StringCustomField
  | TextCustomField
  | NumberCustomField
  | SelectCustomField
  | TagsCustomField
  | BooleanCustomField
  | DateCustomField
  | ImageCustomField

export type CustomFieldsType = {
  [key: string]: CustomFieldType
}

export type DocumentSchemaShape =
  | Document
  | {
      [key: string]: any
    }

export function isArrayCustomField(obj: any): obj is TagsCustomField {
  return obj && obj.fieldType === 'Tags' && Array.isArray(obj.values)
}

export function isFieldWithValues(
  obj: any
): obj is TagsCustomField | SelectCustomField {
  return (
    obj &&
    Array.isArray(obj.values) &&
    (obj.fieldType === 'Tags' || obj.fieldType === 'Select')
  )
}

export function isSelectCustomField(obj: any): obj is SelectCustomField {
  return obj && obj.fieldType === 'Select' && Array.isArray(obj.values)
}

export function createCustomFieldDefinition({
  title,
  fieldType,
  description,
  required,
  values = []
}: CustomFieldDefinitionInput): CustomFieldType {
  const baseField = {
    title,
    description,
    required
  }

  switch (fieldType) {
    case 'String':
      return { ...baseField, fieldType, dataType: 'string' }
    case 'Text':
      return { ...baseField, fieldType, dataType: 'string' }
    case 'Number':
      return { ...baseField, fieldType, dataType: 'number' }
    case 'Select':
      return { ...baseField, fieldType, dataType: 'string', values }
    case 'Tags':
      return { ...baseField, fieldType, dataType: 'array', values }
    case 'Boolean':
      return { ...baseField, fieldType, dataType: 'boolean' }
    case 'Date':
      return { ...baseField, fieldType, dataType: 'date' }
    case 'Image':
      return { ...baseField, fieldType, dataType: 'image' }
  }
}

export type MDExtensions = 'md' | 'mdx'

export * from './singleton'
