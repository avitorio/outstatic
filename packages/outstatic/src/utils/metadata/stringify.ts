import { firstBy } from 'thenby'
import { BlocksSchema, MediaSchema, type MetadataSchema } from './types'
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
  return s as string
}

/**
 * Stringify media in a deterministic way.
 * Before any save of media, this ensures the file we write has minimal
 * change deltas by using a deterministic sort
 * Sort the media collection:
 *   - by `filename`
 *
 * Mutate:
 *   - order keys deterministically (json-stable-stringify)
 */
export const stringifyMedia = (m: MediaSchema): string => {
  m.media = m.media.sort(firstBy('filename'))

  const s = stringify(m, { space: 2 })
  return s as string
}

/**
 * Stringify blocks in a deterministic way.
 * Sort the block collection by component name and refresh the generated date.
 */
export const stringifyBlocks = (m: BlocksSchema): string => {
  m.generated = new Date().toISOString()
  m.blocks = m.blocks.sort(firstBy('name'))

  const s = stringify(m, { space: 2 })
  return s as string
}
