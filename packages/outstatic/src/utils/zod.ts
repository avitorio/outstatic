import { CustomFieldsType } from '@/types'
import { z } from 'zod'
import { documentShape } from './schemas/edit-document-schema'

export const convertSchemaToZod = (customFields: {
  properties: CustomFieldsType
}): z.ZodObject<any> => {
  const shape: Record<string, z.ZodTypeAny> = {}

  for (const [name, field] of Object.entries(customFields.properties)) {
    let fieldSchema: z.ZodTypeAny

    switch (field.dataType) {
      case 'string':
        fieldSchema = z.string()
        break
      case 'number':
        fieldSchema = z.coerce.number()
        break
      case 'boolean':
        fieldSchema = z.boolean()
        break
      case 'array':
        fieldSchema = z.array(z.any())
        break
      case 'date':
        fieldSchema = z.date(z.any())
        break
      case 'image':
        fieldSchema = z.string()
        break
      default:
        fieldSchema = z.any()
    }

    if (field.required) {
      fieldSchema = fieldSchema.refine((val) => val !== '', {
        message: `${field.title} is a required field.`
      })
    } else {
      fieldSchema = fieldSchema.optional()
    }

    if (field.dataType === 'number') {
      fieldSchema = fieldSchema.refine((val) => !isNaN(val), {
        message: `${field.title} must be a valid number.`
      })
    }

    if (field.dataType === 'array' && field.required) {
      fieldSchema = fieldSchema.refine((val) => val.length > 0, {
        message: `${field.title} is a required field.`
      })
    }

    shape[name] = fieldSchema
  }

  const schema = {
    ...documentShape,
    ...shape
  }

  const mergedSchema = z.object(schema)

  return mergedSchema
}
