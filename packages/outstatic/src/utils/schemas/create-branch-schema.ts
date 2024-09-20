import { z } from 'zod'

export const CreateBranchSchema = z.object({
  branchName: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-zA-Z0-9-_/]+$/, {
      message:
        'Branch name can only contain alphanumeric characters, hyphens, underscores, and forward slashes'
    })
    .refine((name) => !name.startsWith('-') && !name.endsWith('-'), {
      message: 'Branch name cannot start or end with a hyphen'
    })
    .refine((name) => !name.startsWith('/') && !name.endsWith('/'), {
      message: 'Branch name cannot start or end with a forward slash'
    })
    .refine((name) => !name.includes('..'), {
      message: 'Branch name cannot contain two consecutive dots'
    })
    .refine((name) => !name.includes('//'), {
      message: 'Branch name cannot contain two consecutive forward slashes'
    })
})
