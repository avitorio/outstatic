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
  'RichText',
  'Number',
  'Select',
  'Tags',
  'Boolean',
  'Date',
  'Image',
  'Object',
  'Array'
] as const

export const customFieldTypeLabels = {
  String: 'String',
  Text: 'Text',
  RichText: 'Rich Text',
  Number: 'Number',
  Select: 'Select',
  Tags: 'Tags',
  Boolean: 'Boolean',
  Date: 'Date',
  Image: 'Image',
  Object: 'Object',
  Array: 'Array'
} satisfies Record<(typeof customFieldTypes)[number], string>

export const customFieldData = [
  'string',
  'number',
  'array',
  'boolean',
  'date',
  'image',
  'object'
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
export type PrimitiveArrayItemType = Exclude<ArrayItemType, 'Object'>
export type ArraySubFieldType = PrimitiveArrayItemType | 'Object' | 'Array'

export type CustomFieldArrayValue = {
  label: string
  value: string
}

type BaseArraySubFieldDefinition = {
  title: string
  description?: string
  required?: boolean
}

export type PrimitiveArraySubFieldDefinition = BaseArraySubFieldDefinition & {
  fieldType: PrimitiveArrayItemType
}

export type ObjectArraySubFieldDefinition = BaseArraySubFieldDefinition & {
  fieldType: 'Object'
  fields?: { [key: string]: ArraySubFieldDefinition }
}

export type NestedArraySubFieldDefinition = BaseArraySubFieldDefinition & {
  fieldType: 'Array'
  itemType: ArrayItemType
  fields?: { [key: string]: ArraySubFieldDefinition }
}

export type ArraySubFieldDefinition =
  | PrimitiveArraySubFieldDefinition
  | ObjectArraySubFieldDefinition
  | NestedArraySubFieldDefinition

export type CustomFieldDefinitionInput = {
  title: string
  fieldType: (typeof customFieldTypes)[number]
  description?: string
  required?: boolean
  values?: CustomFieldArrayValue[]
  itemType?: ArrayItemType
  minItems?: number
  maxItems?: number
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

export type RichTextCustomField = BaseCustomField<'RichText', 'string'>

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

export type ObjectCustomField = BaseCustomField<'Object', 'object'> & {
  fields?: { [key: string]: ArraySubField }
}

type BaseArraySubField = {
  title: string
  description?: string
  required?: boolean
}

export type PrimitiveArraySubField = BaseArraySubField & {
  fieldType: PrimitiveArrayItemType
  dataType: Exclude<(typeof customFieldData)[number], 'array' | 'object'>
}

export type ObjectArraySubField = BaseArraySubField & {
  fieldType: 'Object'
  dataType: 'object'
  fields?: { [key: string]: ArraySubField }
}

export type NestedArraySubField = BaseArraySubField & {
  fieldType: 'Array'
  dataType: 'array'
  itemType: ArrayItemType
  fields?: { [key: string]: ArraySubField }
}

export type ArraySubField =
  | PrimitiveArraySubField
  | ObjectArraySubField
  | NestedArraySubField

export type ArrayCustomField = BaseCustomField<'Array', 'array'> & {
  itemType: ArrayItemType
  fields?: { [key: string]: ArraySubField }
  minItems?: number
  maxItems?: number
}

export type CustomFieldType =
  | StringCustomField
  | TextCustomField
  | RichTextCustomField
  | NumberCustomField
  | SelectCustomField
  | TagsCustomField
  | BooleanCustomField
  | DateCustomField
  | ImageCustomField
  | ObjectCustomField
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

export function isObjectCustomField(obj: any): obj is ObjectCustomField {
  return obj && obj.fieldType === 'Object'
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
  PrimitiveArrayItemType,
  Exclude<(typeof customFieldData)[number], 'array' | 'object'>
> = {
  String: 'string',
  Text: 'string',
  Number: 'number',
  Boolean: 'boolean',
  Date: 'date',
  Image: 'image'
}

const createArraySubFieldDefinition = (
  sub: ArraySubFieldDefinition
): ArraySubField => {
  const baseField = {
    title: sub.title,
    description: sub.description,
    required: sub.required
  }

  if (sub.fieldType === 'Object') {
    return {
      ...baseField,
      fieldType: 'Object',
      dataType: 'object',
      fields: createArraySubFieldDefinitions(sub.fields)
    }
  }

  if (sub.fieldType === 'Array') {
    const arrayField: NestedArraySubField = {
      ...baseField,
      fieldType: 'Array',
      dataType: 'array',
      itemType: sub.itemType ?? 'String'
    }

    if (arrayField.itemType === 'Object') {
      arrayField.fields = createArraySubFieldDefinitions(sub.fields)
    }

    return arrayField
  }

  return {
    ...baseField,
    fieldType: sub.fieldType,
    dataType: ARRAY_ITEM_DATA_TYPE[sub.fieldType]
  }
}

const createArraySubFieldDefinitions = (fields?: {
  [key: string]: ArraySubFieldDefinition
}): { [key: string]: ArraySubField } => {
  const resolvedFields: { [key: string]: ArraySubField } = {}

  for (const [key, sub] of Object.entries(fields ?? {})) {
    resolvedFields[key] = createArraySubFieldDefinition(sub)
  }

  return resolvedFields
}

export function createCustomFieldDefinition({
  title,
  fieldType,
  description,
  required,
  values = [],
  itemType,
  minItems,
  maxItems,
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
    case 'RichText':
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
    case 'Object':
      return {
        ...baseField,
        fieldType,
        dataType: 'object',
        fields: createArraySubFieldDefinitions(fields)
      }
    case 'Array': {
      const resolvedItemType: ArrayItemType = itemType ?? 'String'
      const arrayField: ArrayCustomField = {
        ...baseField,
        fieldType,
        dataType: 'array',
        itemType: resolvedItemType
      }
      if (typeof minItems === 'number') {
        arrayField.minItems = minItems
      }
      if (typeof maxItems === 'number') {
        arrayField.maxItems = maxItems
      }
      if (resolvedItemType === 'Object') {
        arrayField.fields = createArraySubFieldDefinitions(fields)
      }
      return arrayField
    }
  }
}

export type MDExtensions = 'md' | 'mdx'

export * from './singleton'
