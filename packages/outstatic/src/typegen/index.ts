/**
 * Outstatic Type Generation
 *
 * Exports functions for generating TypeScript types from schemas.
 */

export { generateTypes, generateTypesSync, watchSchemas } from './generator'
export type { GenerateTypesOptions } from './generator'
export {
  schemaToInterface,
  slugToInterfaceName,
  dataTypeToTS
} from './schema-to-ts'
export type { Schema, SchemaField, DataType } from './schema-to-ts'
