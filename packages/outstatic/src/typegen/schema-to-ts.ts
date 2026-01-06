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

export interface SchemaField {
  title: string
  fieldType: string
  dataType: DataType
  description?: string
  required?: boolean
  values?: Array<{ label: string; value: string }>
}

export interface Schema {
  title: string
  type: 'object'
  properties: Record<string, SchemaField>
}

/**
 * Maps a schema dataType to its TypeScript equivalent
 */
export function dataTypeToTS(field: SchemaField): string {
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
  return slug
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('')
}
