import { useEffect, useState } from 'react'
import { useCallback } from 'react'
import { toast } from 'sonner'
import useOid from './use-oid'
import { useOutstatic } from './use-outstatic'
import { useCreateCommit } from './use-create-commit'
import { createCommitApi } from '../create-commit-api'
import { hashFromUrl } from '../hash-from-url'
import { stringifyMedia } from '../metadata/stringify'
import { MediaItem, MediaSchema, MediaSourceConfig } from '../metadata/types'
import MurmurHash3 from 'imurmurhash'
import { GET_FILE } from '@/graphql/queries/file'
import { GET_FILES } from '@/graphql/queries/files'
import {
  getMediaTypeForFilename,
  isFilenameAllowedForSource
} from '../media-config'

type TreeEntry = {
  path: string
  name: string
  type: string
  object?: {
    commitUrl?: string
  }
}

type FilesResponse = {
  repository?: {
    object?: {
      commitUrl?: string
      entries?: TreeEntry[]
    } | null
  }
}

type MediaFileResponse = {
  repository?: {
    object?: {
      text?: string
    } | null
  } | null
}

type FailedSourceFetch = {
  reason: unknown
  sourceName: string
}

type RebuildMediaJsonOptions = {
  onComplete?: () => void
  sources?: MediaSourceConfig[]
}

type ExistingMediaLookup = {
  byHash: Map<string, MediaItem>
  byPath: Map<string, MediaItem>
  bySourcePath: Map<string, MediaItem>
}

const getSourcePathKey = (source: string | undefined, path: string) =>
  `${source ?? ''}:${path}`

const createExistingMediaLookup = (
  mediaItems: MediaItem[]
): ExistingMediaLookup => {
  const byHash = new Map<string, MediaItem>()
  const byPath = new Map<string, MediaItem>()
  const bySourcePath = new Map<string, MediaItem>()

  mediaItems.forEach((item) => {
    const hash = item.__outstatic?.hash
    const path = item.__outstatic?.path

    if (hash && !byHash.has(hash)) {
      byHash.set(hash, item)
    }

    if (path) {
      if (!byPath.has(path)) {
        byPath.set(path, item)
      }

      const sourcePathKey = getSourcePathKey(item.source, path)
      if (!bySourcePath.has(sourcePathKey)) {
        bySourcePath.set(sourcePathKey, item)
      }
    }
  })

  return { byHash, byPath, bySourcePath }
}

const getPreservedPublishedAt = (
  item: MediaItem,
  existingMediaLookup: ExistingMediaLookup
) => {
  const existingItems = [
    existingMediaLookup.byHash.get(item.__outstatic.hash),
    existingMediaLookup.bySourcePath.get(
      getSourcePathKey(item.source, item.__outstatic.path)
    ),
    existingMediaLookup.byPath.get(item.__outstatic.path)
  ]

  for (const existingItem of existingItems) {
    const publishedAt = existingItem?.publishedAt

    if (typeof publishedAt === 'string' && publishedAt.trim()) {
      return publishedAt
    }
  }
}

const createMediaItem = (
  entry: TreeEntry,
  source: MediaSourceConfig,
  parentCommit: string,
  existingMediaLookup?: ExistingMediaLookup
): MediaItem => {
  const item: MediaItem = {
    __outstatic: {
      hash: `${MurmurHash3(`${source.name}:${entry.path}:${entry.name}`).result()}`,
      commit: entry.object?.commitUrl
        ? hashFromUrl(entry.object.commitUrl)
        : parentCommit,
      path: `${entry.path}`
    },
    filename: `${entry.name}`,
    type: getMediaTypeForFilename(entry.name, source),
    source: source.name,
    publishedAt: new Date().toISOString(),
    alt: ''
  }

  const preservedPublishedAt = existingMediaLookup
    ? getPreservedPublishedAt(item, existingMediaLookup)
    : undefined

  return preservedPublishedAt
    ? { ...item, publishedAt: preservedPublishedAt }
    : item
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
}

const formatSourceFetchError = (failedSources: FailedSourceFetch[]) => {
  const details = failedSources
    .map(({ sourceName, reason }) => {
      const reasonMessage = getErrorMessage(reason, 'Unknown error')
      return `"${sourceName}" (${reasonMessage})`
    })
    .join(', ')

  return `Failed to rebuild media library because one or more sources could not be loaded: ${details}. media.json was not updated.`
}

export const useRebuildMediaJson = () => {
  const [total, setTotal] = useState(0)
  const [processed, setProcessed] = useState(0)
  const fetchOid = useOid()
  const mutation = useCreateCommit()
  const {
    gqlClient,
    repoOwner,
    repoSlug,
    repoBranch,
    ostPath,
    mediaJsonPath,
    media,
    session
  } = useOutstatic()

  const toastId = 'media-json-rebuild'

  useEffect(() => {
    if (total >= 1 && processed >= 1) {
      toast.loading(`Processing files: ${processed}/${total}`, {
        id: toastId,
        duration: Infinity
      })
    }
    if (processed === total && total > 0 && processed > 0) {
      toast.dismiss(toastId)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTotal(0)
      setProcessed(0)
    }
  }, [processed, total])

  const fetchSourceFiles = useCallback(
    async (source: MediaSourceConfig) => {
      const { repository } = await gqlClient.request(GET_FILES, {
        owner: repoOwner || session?.user?.login || '',
        name: repoSlug,
        contentPath: `${repoBranch}:${source.input}`
      })

      if (!repository?.object) {
        throw new Error(`Media source "${source.name}" could not be loaded.`)
      }

      return { repository } as FilesResponse
    },
    [gqlClient, repoBranch, repoOwner, repoSlug, session?.user?.login]
  )

  const fetchExistingMediaItems = useCallback(async () => {
    try {
      const { repository } = (await gqlClient.request(GET_FILE, {
        owner: repoOwner || session?.user?.login || '',
        name: repoSlug,
        filePath: `${repoBranch}:${mediaJsonPath}`
      })) as MediaFileResponse

      const text = repository?.object?.text

      if (!text) {
        return []
      }

      const database = JSON.parse(text) as Partial<MediaSchema>

      return Array.isArray(database.media)
        ? (database.media as MediaItem[])
        : []
    } catch (error) {
      console.error(
        'Failed to fetch existing media.json before rebuild.',
        error
      )
      return []
    }
  }, [gqlClient, mediaJsonPath, repoBranch, repoOwner, repoSlug, session])

  const processFiles = useCallback(
    async (
      files: MediaItem[],
      parentCommit: string,
      onComplete?: () => void
    ) => {
      setTotal(Math.max(files.length, 1))

      const oid = await fetchOid()

      if (!oid) {
        throw new Error('Unable to determine repository oid')
      }

      const database: MediaSchema = {
        commit: parentCommit,
        generated: new Date().toISOString(),
        media: files.filter(Boolean)
      }

      const commitApi = createCommitApi({
        message: 'chore: Updates media.json',
        owner: repoOwner || session?.user?.login || '',
        name: repoSlug,
        branch: repoBranch,
        oid
      })

      commitApi.replaceFile(
        `${ostPath}/media/media.json`,
        stringifyMedia(database)
      )

      const payload = commitApi.createInput()

      try {
        await toast.promise(mutation.mutateAsync(payload), {
          loading: 'Updating media library...',
          success: () => {
            onComplete?.()
            return 'Media library updated successfully'
          },
          error: (error) =>
            getErrorMessage(error, 'Failed to update media library')
        })
      } catch (error) {
        console.error(error)
        throw error
      }
    },
    [
      fetchOid,
      mutation,
      ostPath,
      repoBranch,
      repoOwner,
      repoSlug,
      session?.user?.login
    ]
  )

  const rebuildMediaJson = useCallback(
    async ({ onComplete, sources }: RebuildMediaJsonOptions = {}) => {
      const configuredSources = sources ?? media ?? []

      if (configuredSources.length === 0) {
        return
      }

      const existingMediaItemsPromise = fetchExistingMediaItems()

      return toast.promise(
        Promise.allSettled(
          configuredSources.map((source) => fetchSourceFiles(source))
        ).then(async (results) => {
          const failedSources = results.flatMap((result, index) => {
            if (result.status === 'fulfilled') {
              return []
            }

            const sourceName = configuredSources[index]?.name ?? 'unknown'

            console.error(
              `Failed to fetch media files for source "${sourceName}".`,
              result.reason
            )

            return [{ sourceName, reason: result.reason }]
          })

          if (failedSources.length > 0) {
            throw new Error(formatSourceFetchError(failedSources))
          }

          const existingMediaLookup = createExistingMediaLookup(
            await existingMediaItemsPromise
          )
          const mediaItems: MediaItem[] = []
          const responses = results.map((result, index) => {
            if (result.status !== 'fulfilled') {
              throw new Error(
                'Media source fetch failed after validation. media.json was not updated.'
              )
            }

            return {
              response: result.value,
              source: configuredSources[index]
            }
          })

          responses.forEach(({ response, source }) => {
            const entries = response.repository?.object?.entries ?? []
            const parentCommit = response.repository?.object?.commitUrl
              ? hashFromUrl(response.repository.object.commitUrl)
              : ''

            entries.forEach((entry) => {
              if (
                entry.type !== 'blob' ||
                !isFilenameAllowedForSource(entry.name, source)
              ) {
                return
              }

              mediaItems.push(
                createMediaItem(
                  entry,
                  source,
                  parentCommit,
                  existingMediaLookup
                )
              )
            })
          })

          const parentCommit =
            responses
              .map(({ response }) => response.repository?.object?.commitUrl)
              .find(Boolean)
              ?.toString()
              ?.trim() ?? ''

          return toast.promise(
            processFiles(
              mediaItems,
              parentCommit ? hashFromUrl(parentCommit) : '',
              () => onComplete?.()
            ),
            {
              id: toastId,
              duration: 4000,
              loading: 'Processing files...',
              success: 'Files processed successfully',
              error: (error) => getErrorMessage(error, 'Error processing files')
            }
          )
        }),
        {
          loading: 'Fetching media files...',
          success: 'Media files fetched successfully',
          error: (error) =>
            getErrorMessage(error, 'Failed to fetch media files')
        }
      )
    },
    [fetchExistingMediaItems, fetchSourceFiles, media, processFiles]
  )

  return rebuildMediaJson
}
