import { z } from 'zod/v4'
import { mediaCategories } from '../metadata/types'
import {
  getAllowedExtensionsForSource,
  hasAllowedMediaTypes,
  normalizeMediaSource,
  normalizeMediaSources
} from '../media-config'

const legacyMediaPathSchema = z
  .string()
  .min(1)
  .refine((path) => path.endsWith('/'), {
    message: "Path must end with '/'"
  })

const MediaSourceSchema = z
  .object({
    name: z.string().trim().min(1),
    label: z.string().trim().min(1),
    input: z.string().trim().min(1),
    output: z.string().trim().min(1),
    extensions: z.array(z.string().trim().min(1)).optional(),
    categories: z.array(z.enum(mediaCategories)).optional()
  })
  .passthrough()
  .superRefine((source, ctx) => {
    const normalizedSource = normalizeMediaSource(source)

    if (!hasAllowedMediaTypes(normalizedSource)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Media sources must define at least one extension or category.'
      })
    }
  })
  .transform((source) => normalizeMediaSource(source))

export const ConfigSchema = z
  .object({
    publicMediaPath: legacyMediaPathSchema.optional(),
    repoMediaPath: legacyMediaPathSchema.optional(),
    media: z.array(MediaSourceSchema).optional(),
    mdExtension: z.union([z.literal('md'), z.literal('mdx')]).optional()
  })
  .passthrough()
  .superRefine((config, ctx) => {
    const media = normalizeMediaSources(config.media)
    const nameCounts = new Map<string, number>()
    const extensionOwners = new Map<string, number[]>()

    media.forEach((source) => {
      nameCounts.set(source.name, (nameCounts.get(source.name) ?? 0) + 1)
    })

    media.forEach((source, index) => {
      getAllowedExtensionsForSource(source).forEach((extension) => {
        const owners = extensionOwners.get(extension) ?? []
        owners.push(index)
        extensionOwners.set(extension, owners)
      })
    })

    media.forEach((source, index) => {
      if ((nameCounts.get(source.name) ?? 0) > 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['media', index, 'name'],
          message: 'Media source names must be unique.'
        })
      }

      const overlappingExtensions = getAllowedExtensionsForSource(
        source
      ).filter((extension) => (extensionOwners.get(extension)?.length ?? 0) > 1)

      if (overlappingExtensions.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['media', index, 'extensions'],
          message: `Media source extensions must not overlap. Duplicate extensions: ${overlappingExtensions.join(
            ', '
          )}.`
        })
      }
    })
  })
  .transform((config) => ({
    ...config,
    media: config.media ? normalizeMediaSources(config.media) : undefined
  }))
