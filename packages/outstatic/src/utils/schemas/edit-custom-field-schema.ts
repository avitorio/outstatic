import {
  customFieldSchemaBase,
  refineCustomFieldSchema
} from './custom-field-schema'

export const editCustomFieldSchema = customFieldSchemaBase.superRefine(
  refineCustomFieldSchema
)
