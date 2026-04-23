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
import { GET_FILES } from '@/graphql/queries/files'
import { getMediaTypeForFilename } from '../media-config'

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

const createMediaItem = (
  entry: TreeEntry,
  source: MediaSourceConfig,
  parentCommit: string
): MediaItem => ({
  __outstatic: {
    hash: `${MurmurHash3().result()}`,
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
})

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

      return { repository } as FilesResponse
    },
    [gqlClient, repoBranch, repoOwner, repoSlug, session?.user?.login]
  )

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
        generated: new Date().toUTCString(),
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
        toast.promise(mutation.mutateAsync(payload), {
          loading: 'Updating media library...',
          success: () => {
            onComplete?.()
            return 'Media library updated successfully'
          },
          error: 'Failed to update media library'
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
    async ({
      onComplete
    }: {
      onComplete?: () => void
    } = {}) => {
      const configuredSources = media ?? []

      if (configuredSources.length === 0) {
        return
      }

      return new Promise((resolve, reject) => {
        toast.promise(
          Promise.allSettled(
            configuredSources.map((source) => fetchSourceFiles(source))
          ).then((results) => {
            const mediaItems: MediaItem[] = []
            const responses = results.flatMap((result, index) => {
              if (result.status === 'fulfilled') {
                return [
                  {
                    response: result.value,
                    source: configuredSources[index]
                  }
                ]
              }

              console.error(
                `Failed to fetch media files for source "${configuredSources[index]?.name ?? 'unknown'}".`,
                result.reason
              )

              return []
            })

            responses.forEach(({ response, source }) => {
              const entries = response.repository?.object?.entries ?? []
              const parentCommit = response.repository?.object?.commitUrl
                ? hashFromUrl(response.repository.object.commitUrl)
                : ''

              entries.forEach((entry) => {
                if (entry.type !== 'blob') {
                  return
                }

                mediaItems.push(createMediaItem(entry, source, parentCommit))
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
                error: 'Error processing files'
              }
            )
          }),
          {
            loading: 'Fetching media files...',
            success: () => {
              resolve(undefined)
              return 'Media files fetched successfully'
            },
            error: (err) => {
              reject(err)
              return 'Failed to fetch media files'
            }
          }
        )
      })
    },
    [fetchSourceFiles, media, processFiles]
  )

  return rebuildMediaJson
}
