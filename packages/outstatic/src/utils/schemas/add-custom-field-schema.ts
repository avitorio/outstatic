import {
  customFieldSchemaBase,
  refineCustomFieldSchema
} from './custom-field-schema'

export const addCustomFieldSchema = customFieldSchemaBase.superRefine(
  refineCustomFieldSchema
)
