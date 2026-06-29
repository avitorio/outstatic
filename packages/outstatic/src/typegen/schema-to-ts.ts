/**
 * Converts Outstatic schema field definitions to TypeScript types
 */

export type DataType =
  | 'string'
  | 'number'
  | 'array'
  | 'boolean'
  | 'date'
  | 'image'
  | 'object'

export type ArrayItemType =
  | 'String'
  | 'Text'
  | 'Number'
  | 'Boolean'
  | 'Date'
  | 'Image'
  | 'Object'

export interface SchemaSubField {
  title: string
  fieldType: Exclude<ArrayItemType, 'Object'> | 'Object' | 'Array'
  dataType: DataType
  description?: string
  required?: boolean
  itemType?: ArrayItemType
  fields?: Record<string, SchemaSubField>
}

export interface SchemaField {
  title: string
  fieldType: string
  dataType: DataType
  description?: string
  required?: boolean
  values?: Array<{ label: string; value: string }>
  itemType?: ArrayItemType
  fields?: Record<string, SchemaSubField>
}

export interface Schema {
  title: string
  type: 'object'
  properties: Record<string, SchemaField>
}

const PRIMITIVE_ITEM_TS: Record<Exclude<ArrayItemType, 'Object'>, string> = {
  String: 'string',
  Text: 'string',
  Number: 'number',
  Boolean: 'boolean',
  Date: 'string',
  Image: 'string'
}

const objectFieldsToTS = (
  fields: Record<string, SchemaSubField> | undefined
): string => {
  if (!fields || Object.keys(fields).length === 0) {
    return 'Record<string, unknown>'
  }

  const props = Object.entries(fields)
    .map(([key, sub]) => {
      const optional = sub.required ? '' : '?'
      const safeName = sanitizeFieldName(key)
      return `${safeName}${optional}: ${subFieldToTS(sub)}`
    })
    .join('; ')

  return `{ ${props} }`
}

const arrayItemToTS = (
  itemType: ArrayItemType | undefined,
  fields: Record<string, SchemaSubField> | undefined
): string => {
  const resolvedItemType = itemType ?? 'String'

  if (resolvedItemType === 'Object') {
    return `Array<${objectFieldsToTS(fields)}>`
  }

  const itemTS = PRIMITIVE_ITEM_TS[resolvedItemType] ?? 'unknown'
  return `${itemTS}[]`
}

const subFieldToTS = (field: SchemaSubField): string => {
  if (field.fieldType === 'Object') {
    return objectFieldsToTS(field.fields)
  }

  if (field.fieldType === 'Array') {
    return arrayItemToTS(field.itemType, field.fields)
  }

  return PRIMITIVE_ITEM_TS[field.fieldType] ?? 'unknown'
}

/**
 * Maps a schema dataType to its TypeScript equivalent
 */
export function dataTypeToTS(field: SchemaField): string {
  if (field.fieldType === 'Select') {
    if (field.values && field.values.length > 0) {
      return field.values.map((v) => `'${v.value}'`).join(' | ')
    }

    return 'string'
  }

  if (field.fieldType === 'Array') {
    return arrayItemToTS(field.itemType, field.fields)
  }

  switch (field.dataType) {
    case 'string':
      return 'string'
    case 'number':
      return 'number'
    case 'boolean':
      return 'boolean'
    case 'date':
      // Dates are stored as ISO strings in frontmatter
      return 'string'
    case 'image':
      // Images are stored as path strings
      return 'string'
    case 'object':
      return objectFieldsToTS(field.fields)
    case 'array':
      // Arrays can have predefined values (tags) or be generic
      if (field.values && field.values.length > 0) {
        // Generate union type from predefined values
        const valueUnion = field.values.map((v) => `'${v.value}'`).join(' | ')
        return `Array<{ label: string; value: ${valueUnion} }>`
      }
      return 'Array<{ label: string; value: string }>'
    default:
      return 'unknown'
  }
}

/**
 * Converts a field name to a valid TypeScript property name
 */
export function sanitizeFieldName(name: string): string {
  // If the name contains special characters, wrap in quotes
  if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name)) {
    return `'${name}'`
  }
  return name
}

/**
 * Generates a TypeScript interface from a schema
 */
export function schemaToInterface(
  schema: Schema,
  interfaceName: string
): string {
  const properties = schema.properties || {}
  const lines: string[] = []

  lines.push(`export interface ${interfaceName}Fields {`)

  for (const [fieldName, field] of Object.entries(properties)) {
    const tsType = dataTypeToTS(field)
    const optional = field.required ? '' : '?'
    const safeName = sanitizeFieldName(fieldName)

    if (field.description) {
      lines.push(`  /** ${field.description} */`)
    }
    lines.push(`  ${safeName}${optional}: ${tsType}`)
  }

  lines.push('}')

  return lines.join('\n')
}

/**
 * Converts a slug to a PascalCase interface name
 */
export function slugToInterfaceName(slug: string): string {
  let result = slug
    .split(/[-_.]/)
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('')

  // If result starts with a number, prefix with underscore
  if (/^[0-9]/.test(result)) {
    result = '_' + result
  }

  return result
}
