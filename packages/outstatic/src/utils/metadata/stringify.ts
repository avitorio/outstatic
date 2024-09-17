import { firstBy } from 'thenby'
import { MediaSchema, type MetadataSchema } from './types'
import stringify from 'json-stable-stringify'

/**
 * Stingify metadata in a deterministic way.
 * Before any save of metadata, this ensures the file we write has minimal
 * change deltas by using a deterministic sort
 * Sort the metadata collection:
 *   - by `__outstatic.path`
 *
 * Mutate:
 *   - order keys deterministically (json-stable-stringify)
 */
export const stringifyMetadata = (m: MetadataSchema): string => {
  m.metadata = m.metadata.sort(firstBy('__outstatic.path'))

  const s = stringify(m, { space: 2 })
  return s
}

/**
 * Stringify media in a deterministic way.
 * Before any save of media, this ensures the file we write has minimal
 * change deltas by using a deterministic sort
 * Sort the media collection:
 *   - by `publishedAt`
 *
 * Mutate:
 *   - order keys deterministically (json-stable-stringify)
 */
export const stringifyMedia = (m: MediaSchema): string => {
  m.media = m.media.sort(firstBy('__outstatic.path'))

  const s = stringify(m, { space: 2 })
  return s
}
