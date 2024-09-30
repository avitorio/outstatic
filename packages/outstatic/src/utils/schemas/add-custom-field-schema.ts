import { z } from 'zod'
import { customFieldTypes } from '@/types'

export const addCustomFieldSchema = z.object({
  title: z
    .string()
    .regex(/^[aA-zZ\s]+$/, 'Only alphabets are allowed for this field.')
    .min(1, 'Custom field name is required.'),
  fieldType: z.enum(customFieldTypes),
  description: z.string().optional(),
  required: z.boolean()
})
