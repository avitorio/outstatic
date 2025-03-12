import { z } from 'zod'
import { slugRegex } from '@/utils/slugRegex'
import { DocumentSchemaShape } from '@/types'

export const documentShape = {
  title: z.string().optional(),
  publishedAt: z.date().optional(),
  content: z.string().optional(),
  status: z.enum(['published', 'draft'], {
    errorMap: () => ({ message: 'Status is missing.' })
  }),
  author: z.object({
    name: z.string().optional(),
    picture: z.string().optional()
  }),
  slug: z
    .string()
    .regex(
      slugRegex,
      'Slug must contain only lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen.'
    )
    .max(200, 'Slugs can be a maximum of 200 characters.')
    .refine((val) => val !== 'new', 'The word "new" is not a valid slug.')
}

export const editDocumentSchema: z.ZodType<DocumentSchemaShape> =
  z.object(documentShape)
