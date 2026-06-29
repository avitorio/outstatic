import { z } from 'zod/v4'
import { arrayItemTypes, customFieldTypes } from '@/types'

export const MAX_ARRAY_FIELD_DEPTH = 3

const arraySubFieldTypes = [
  'String',
  'Text',
  'Number',
  'Boolean',
  'Date',
  'Image',
  'Object',
  'Array'
] as const

export const arraySubFieldSchema: z.ZodTypeAny = z.lazy(() =>
  z.object({
    name: z
      .string()
      .min(1, 'Sub-field name is required.')
      .regex(
        /^[a-zA-Z_$][a-zA-Z0-9_$]*$/,
        'Sub-field name must be a valid identifier.'
      ),
    title: z.string().min(1, 'Sub-field name is required.'),
    fieldType: z.enum(arraySubFieldTypes),
    itemType: z.enum(arrayItemTypes).optional(),
    description: z.string().optional(),
    required: z.boolean().optional(),
    fields: z.array(arraySubFieldSchema).optional()
  })
)

export const customFieldSchemaBase = z.object({
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

type ArraySubFieldFormValue = {
  name: string
  title: string
  fieldType: (typeof arraySubFieldTypes)[number]
  itemType?: (typeof arrayItemTypes)[number]
  fields?: ArraySubFieldFormValue[]
}

const addIssue = (
  ctx: {
    addIssue: (issue: {
      code: 'custom'
      path: (string | number)[]
      message: string
    }) => void
  },
  path: (string | number)[],
  message: string
) => {
  ctx.addIssue({
    code: 'custom',
    path,
    message
  })
}

const validateSubFields = (
  fields: ArraySubFieldFormValue[] | undefined,
  ctx: Parameters<typeof addIssue>[0],
  path: (string | number)[],
  depth: number
) => {
  if (!fields || fields.length === 0) {
    addIssue(ctx, path, 'Add at least one sub-field.')
    return
  }

  const seen = new Set<string>()

  fields.forEach((sub, index) => {
    const subPath = [...path, index]

    if (seen.has(sub.name)) {
      addIssue(ctx, [...subPath, 'name'], 'Sub-field names must be unique.')
    }
    seen.add(sub.name)

    if (sub.fieldType === 'Object') {
      if (depth >= MAX_ARRAY_FIELD_DEPTH) {
        addIssue(
          ctx,
          [...subPath, 'fieldType'],
          `Sub-fields can be nested up to ${MAX_ARRAY_FIELD_DEPTH} levels.`
        )
        return
      }

      validateSubFields(sub.fields, ctx, [...subPath, 'fields'], depth + 1)
      return
    }

    if (sub.fieldType === 'Array') {
      if (!sub.itemType) {
        addIssue(ctx, [...subPath, 'itemType'], 'Pick an item type.')
        return
      }

      if (sub.itemType === 'Object') {
        if (depth >= MAX_ARRAY_FIELD_DEPTH) {
          addIssue(
            ctx,
            [...subPath, 'fieldType'],
            `Sub-fields can be nested up to ${MAX_ARRAY_FIELD_DEPTH} levels.`
          )
          return
        }

        validateSubFields(sub.fields, ctx, [...subPath, 'fields'], depth + 1)
      }
    }
  })
}

export const refineCustomFieldSchema = (
  data: z.infer<typeof customFieldSchemaBase>,
  ctx: Parameters<typeof addIssue>[0]
) => {
  if (
    data.fieldType === 'Select' &&
    (!data.values || data.values.length === 0)
  ) {
    addIssue(ctx, ['values'], 'Add at least one option for a Select field.')
  }

  if (data.fieldType === 'Object') {
    validateSubFields(
      data.fields as ArraySubFieldFormValue[] | undefined,
      ctx,
      ['fields'],
      1
    )
    return
  }

  if (data.fieldType !== 'Array') {
    return
  }

  if (!data.itemType) {
    addIssue(ctx, ['itemType'], 'Pick an item type for this array.')
  }

  if (data.itemType === 'Object') {
    validateSubFields(
      data.fields as ArraySubFieldFormValue[] | undefined,
      ctx,
      ['fields'],
      1
    )
  }
}
