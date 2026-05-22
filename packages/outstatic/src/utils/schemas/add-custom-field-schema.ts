import { z } from 'zod/v4'
import { arrayItemTypes, customFieldTypes } from '@/types'

const arraySubFieldTypes = [
  'String',
  'Text',
  'Number',
  'Boolean',
  'Date',
  'Image'
] as const

const arraySubFieldSchema = z.object({
  name: z
    .string()
    .min(1, 'Sub-field name is required.')
    .regex(
      /^[a-zA-Z_$][a-zA-Z0-9_$]*$/,
      'Sub-field name must be a valid identifier.'
    ),
  title: z.string().min(1, 'Sub-field name is required.'),
  fieldType: z.enum(arraySubFieldTypes),
  description: z.string().optional(),
  required: z.boolean().optional()
})

export const addCustomFieldSchema = z
  .object({
    title: z
      .string()
      .regex(/^[aA-zZ\s]+$/, 'Only alphabets are allowed for this field.')
      .min(1, 'Custom field name is required.'),
    fieldType: z.enum(customFieldTypes),
    description: z.string().optional(),
    required: z.boolean().optional(),
    values: z
      .array(z.object({ label: z.string(), value: z.string() }))
      .optional(),
    itemType: z.enum(arrayItemTypes).optional(),
    fields: z.array(arraySubFieldSchema).optional()
  })
  .superRefine((data, ctx) => {
    if (
      data.fieldType === 'Select' &&
      (!data.values || data.values.length === 0)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['values'],
        message: 'Add at least one option for a Select field.'
      })
    }

    if (data.fieldType === 'Array') {
      if (!data.itemType) {
        ctx.addIssue({
          code: 'custom',
          path: ['itemType'],
          message: 'Pick an item type for this array.'
        })
      }

      if (
        data.itemType === 'Object' &&
        (!data.fields || data.fields.length === 0)
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['fields'],
          message: 'Add at least one sub-field for an Object array.'
        })
      }

      if (data.itemType === 'Object' && data.fields) {
        const seen = new Set<string>()
        data.fields.forEach((sub, index) => {
          if (seen.has(sub.name)) {
            ctx.addIssue({
              code: 'custom',
              path: ['fields', index, 'name'],
              message: 'Sub-field names must be unique.'
            })
          }
          seen.add(sub.name)
        })
      }
    }
  })
