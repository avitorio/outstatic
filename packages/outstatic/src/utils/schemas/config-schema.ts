import { z } from 'zod/v4'

export const ConfigSchema = z.object({
  publicMediaPath: z
    .string()
    .min(1)
    .refine((path) => path.endsWith('/'), {
      message: "Path must end with '/'"
    })
    .optional(),
  repoMediaPath: z
    .string()
    .min(1)
    .refine((path) => path.endsWith('/'), {
      message: "Path must end with '/'"
    })
    .optional(),
  mdExtension: z.union([z.literal('md'), z.literal('mdx')]).optional()
})
