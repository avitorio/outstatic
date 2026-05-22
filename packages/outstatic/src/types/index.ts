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
  type: string
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
  'Image',
  'Array'
] as const

export const customFieldData = [
  'string',
  'number',
  'array',
  'boolean',
  'date',
  'image'
] as const

export const arrayItemTypes = [
  'String',
  'Text',
  'Number',
  'Boolean',
  'Date',
  'Image',
  'Object'
] as const

export type ArrayItemType = (typeof arrayItemTypes)[number]

export type CustomFieldArrayValue = {
  label: string
  value: string
}

export type ArraySubFieldDefinition = {
  title: string
  fieldType: Exclude<ArrayItemType, 'Object'>
  description?: string
  required?: boolean
}

export type CustomFieldDefinitionInput = {
  title: string
  fieldType: (typeof customFieldTypes)[number]
  description?: string
  required?: boolean
  values?: CustomFieldArrayValue[]
  itemType?: ArrayItemType
  fields?: { [key: string]: ArraySubFieldDefinition }
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

export type ArraySubField = {
  title: string
  fieldType: Exclude<ArrayItemType, 'Object'>
  dataType: (typeof customFieldData)[number]
  description?: string
  required?: boolean
}

export type ArrayCustomField = BaseCustomField<'Array', 'array'> & {
  itemType: ArrayItemType
  fields?: { [key: string]: ArraySubField }
  minItems?: number
  maxItems?: number
}

export type CustomFieldType =
  | StringCustomField
  | TextCustomField
  | NumberCustomField
  | SelectCustomField
  | TagsCustomField
  | BooleanCustomField
  | DateCustomField
  | ImageCustomField
  | ArrayCustomField

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

export function isRepeatableArrayCustomField(
  obj: any
): obj is ArrayCustomField {
  return obj && obj.fieldType === 'Array' && typeof obj.itemType === 'string'
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

const ARRAY_ITEM_DATA_TYPE: Record<
  Exclude<ArrayItemType, 'Object'>,
  (typeof customFieldData)[number]
> = {
  String: 'string',
  Text: 'string',
  Number: 'number',
  Boolean: 'boolean',
  Date: 'date',
  Image: 'image'
}

export function createCustomFieldDefinition({
  title,
  fieldType,
  description,
  required,
  values = [],
  itemType,
  fields
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
    case 'Array': {
      const resolvedItemType: ArrayItemType = itemType ?? 'String'
      const arrayField: ArrayCustomField = {
        ...baseField,
        fieldType,
        dataType: 'array',
        itemType: resolvedItemType
      }
      if (resolvedItemType === 'Object') {
        const sourceFields = fields ?? {}
        const resolvedFields: { [key: string]: ArraySubField } = {}
        for (const [key, sub] of Object.entries(sourceFields)) {
          resolvedFields[key] = {
            title: sub.title,
            fieldType: sub.fieldType,
            dataType: ARRAY_ITEM_DATA_TYPE[sub.fieldType],
            description: sub.description,
            required: sub.required
          }
        }
        arrayField.fields = resolvedFields
      }
      return arrayField
    }
  }
}

export type MDExtensions = 'md' | 'mdx'

export * from './singleton'
