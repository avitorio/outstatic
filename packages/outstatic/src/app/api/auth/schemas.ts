import { z } from 'zod'

/**
 * Schema for magic-link request body
 */
export const MagicLinkRequestSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .max(255, 'Email is too long'),
  returnUrl: z.string().url().optional()
})

export type MagicLinkRequest = z.infer<typeof MagicLinkRequestSchema>

/**
 * Schema for magic-link callback query parameters
 */
export const MagicLinkCallbackSchema = z.object({
  exchange_token: z.string().min(1, 'Exchange token is required')
})

export type MagicLinkCallback = z.infer<typeof MagicLinkCallbackSchema>

/**
 * Schema for the exchange token API response
 */
export const ExchangeTokenResponseSchema = z.object({
  user: z.object({
    email: z.string().email(),
    login: z.string().optional().nullable(),
    name: z.string().optional().nullable(),
    avatar_url: z
      .string()
      .url()
      .optional()
      .nullable()
      .or(z.literal(''))
      .transform((val) => (val === '' ? null : val)),
    permissions: z.array(z.string()).optional().nullable()
  }),
  session: z.object({
    access_token: z.string().min(1),
    refresh_token: z.string().min(1),
    expires_at: z.number().positive()
  }),
  return_url: z.string().url().optional().nullable()
})

export type ExchangeTokenResponse = z.infer<typeof ExchangeTokenResponseSchema>
