import { CustomFieldsType, isSelectCustomField } from '@/types'
import { z } from 'zod/v4'
import { documentShape } from './schemas/edit-document-schema'

const buildDateSchema = ({
  title,
  required
}: {
  title: string
  required?: boolean
}) => {
  const dateSchema = z.date({
    error: ({ input }) => {
      if (input === undefined) {
        return `${title} is a required field.`
      }

      return `${title} must be a valid date.`
    }
  })

  return z.preprocess(
    (value) => {
      if (value === '' || value === null || value === undefined) {
        return undefined
      }

      if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? value : new Date(value)
      }

      if (typeof value === 'string' || typeof value === 'number') {
        const date = new Date(value)
        return Number.isNaN(date.getTime()) ? value : date
      }

      return value
    },
    required ? dateSchema : dateSchema.optional()
  )
}

export const convertSchemaToZod = (customFields: {
  properties: CustomFieldsType
}): z.ZodObject<any> => {
  const shape: Record<string, z.ZodTypeAny> = {}

  for (const [name, field] of Object.entries(customFields.properties)) {
    let fieldSchema: z.ZodTypeAny
    const selectValues = isSelectCustomField(field)
      ? field.values.map(({ value }) => value)
      : null

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
        fieldSchema = buildDateSchema({
          title: field.title,
          required: field.required
        })
        break
      case 'image':
        fieldSchema = z.string()
        break
      default:
        fieldSchema = z.any()
    }

    if (field.required && field.dataType !== 'date') {
      fieldSchema = fieldSchema.refine((val) => val !== '', {
        message: `${field.title} is a required field.`
      })
    } else if (!field.required && field.dataType !== 'date') {
      fieldSchema = fieldSchema.optional()
    }

    if (selectValues && selectValues.length > 0) {
      fieldSchema = fieldSchema.refine(
        (val) =>
          val === undefined ||
          (typeof val === 'string' && selectValues.includes(val)),
        {
          message: `${field.title} must be one of the available options.`
        }
      )
    }

    if (field.dataType === 'number') {
      fieldSchema = fieldSchema.refine(
        (val) => typeof val === 'number' && !isNaN(val),
        {
          message: `${field.title} must be a valid number.`
        }
      )
    }

    if (field.dataType === 'array' && field.required) {
      fieldSchema = fieldSchema.refine(
        (val) => Array.isArray(val) && val.length > 0,
        {
          message: `${field.title} is a required field.`
        }
      )
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
