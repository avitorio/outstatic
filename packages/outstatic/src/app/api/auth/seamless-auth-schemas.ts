import { z } from 'zod';

/**
 * Schema for seamless login callback query parameters
 */
export const SeamlessLoginCallbackSchema = z.object({
  exchange_token: z.string().min(1, 'Exchange token is required'),
});

/**
 * Schema for exchange token response from main API
 */
export const SeamlessLoginExchangeResponseSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string(),
    avatar_url: z
      .string()
      .url()
      .optional()
      .nullable()
      .or(z.literal(''))
      .transform((val) => (val === '' ? null : val)),
  }),
  session: z.object({
    access_token: z.string().min(1),
    refresh_token: z.string().min(1),
    expires_at: z.number().positive(),
  }),
  project: z
    .object({
      id: z.string().uuid(),
      name: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  return_url: z.string().url().optional().nullable(),
});
