import { z } from 'zod'

export const ConfigSchema = z.object({
  publicMediaPath: z
    .string()
    .min(1)
    .refine((path) => path.endsWith('/'), {
      message: "Path must end with '/'"
    }),
  repoMediaPath: z
    .string()
    .min(1)
    .refine((path) => path.endsWith('/'), {
      message: "Path must end with '/'"
    })
})
