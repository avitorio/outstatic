import { z } from 'zod/v4'
import { blockPropTypes } from '@/utils/metadata/types'

export const blockTagValueSchema = z.object({
  label: z.string(),
  value: z.string()
})

export const blockPropSchema = z.object({
  name: z
    .string()
    .min(1, 'Prop name is required.')
    .regex(/^[a-z][A-Za-z0-9]*$/, 'Prop name must be camelCase.'),
  type: z.enum(blockPropTypes),
  required: z.boolean().optional(),
  description: z.string().optional(),
  defaultValue: z.string().optional(),
  options: z.array(z.string()).optional()
})

export const blockFormPropSchema = blockPropSchema.extend({
  options: z.array(blockTagValueSchema).optional()
})

export const blockSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Component name is required.')
      .regex(
        /^[A-Z][A-Za-z0-9]*$/,
        'Component name must be PascalCase (start with an uppercase letter).'
      ),
    description: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    imports: z.string().optional(),
    additionalAttributes: z.string().optional(),
    icon: z.string().optional(),
    props: z.array(blockPropSchema)
  })
  .superRefine((data, ctx) => {
    const seen = new Set<string>()

    data.props.forEach((prop, index) => {
      if (seen.has(prop.name)) {
        ctx.addIssue({
          code: 'custom',
          path: ['props', index, 'name'],
          message: 'Prop names must be unique within a block.'
        })
      }
      seen.add(prop.name)

      if (
        prop.type === 'Select' &&
        (!prop.options || prop.options.length === 0)
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['props', index, 'options'],
          message: 'Add at least one option for a Select prop.'
        })
      }
    })

    const childrenCount = data.props.filter(
      (prop) => prop.type === 'Children'
    ).length

    if (childrenCount > 1) {
      ctx.addIssue({
        code: 'custom',
        path: ['props'],
        message: 'A block can have at most one Children prop.'
      })
    }
  })

export const blockFormSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Component name is required.')
      .regex(
        /^[A-Z][A-Za-z0-9]*$/,
        'Component name must be PascalCase (start with an uppercase letter).'
      ),
    description: z.string().optional(),
    keywords: z.array(blockTagValueSchema).optional(),
    imports: z.string().optional(),
    additionalAttributes: z.string().optional(),
    icon: z.string().optional(),
    props: z.array(blockFormPropSchema)
  })
  .superRefine((data, ctx) => {
    const seen = new Set<string>()

    data.props.forEach((prop, index) => {
      if (seen.has(prop.name)) {
        ctx.addIssue({
          code: 'custom',
          path: ['props', index, 'name'],
          message: 'Prop names must be unique within a block.'
        })
      }
      seen.add(prop.name)

      if (
        prop.type === 'Select' &&
        (!prop.options || prop.options.length === 0)
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['props', index, 'options'],
          message: 'Add at least one option for a Select prop.'
        })
      }
    })

    const childrenCount = data.props.filter(
      (prop) => prop.type === 'Children'
    ).length

    if (childrenCount > 1) {
      ctx.addIssue({
        code: 'custom',
        path: ['props'],
        message: 'A block can have at most one Children prop.'
      })
    }
  })

export type BlockFormValues = z.infer<typeof blockSchema>
export type BlockDialogFormValues = z.infer<typeof blockFormSchema>
