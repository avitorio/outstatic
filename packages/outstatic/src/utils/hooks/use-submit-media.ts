import { FileType } from '@/types'
import { createCommitApi } from '@/utils/create-commit-api'
import { hashFromUrl } from '@/utils/hash-from-url'
import { useOutstatic } from '@/utils/hooks/use-outstatic'
import { stringifyMedia } from '@/utils/metadata/stringify'
import MurmurHash3 from 'imurmurhash'
import { useCallback } from 'react'
import { MediaItem, MediaSchema, MediaSourceConfig } from '../metadata/types'
import { useCreateCommit } from './use-create-commit'
import useOid from './use-oid'
import { useGetMediaFiles } from './use-get-media-files'
import { buildRepoMediaPath, getMediaTypeForFilename } from '../media-config'

const createMediaFilename = (filename: string) => {
  const randString = window.btoa(Math.random().toString()).substring(6, 10)

  return filename
    .toLowerCase()
    .replace(/[^a-zA-Z0-9-_\.]/g, '-')
    .replace(/(\.[^\.]*)?$/, `-${randString}$1`)
}

function useSubmitMedia() {
  const createCommit = useCreateCommit()
  const { repoOwner, repoSlug, repoBranch, session, mediaJsonPath } =
    useOutstatic()
  const fetchOid = useOid()

  const { refetch: refetchMedia } = useGetMediaFiles({
    enabled: false
  })

  const onSubmit = useCallback(
    async ({
      files,
      source
    }: {
      files: FileType[]
      source?: MediaSourceConfig
    }) => {
      if (files.length === 0 || !source) {
        return
      }

      try {
        const oid = await fetchOid()
        const owner = repoOwner || session?.user?.login || ''
        const { data: mediaData, isError } = await refetchMedia()

        if (isError) {
          throw new Error('Error fetching media data')
        }

        const capi = createCommitApi({
          message:
            files.length === 1
              ? `chore: Adds ${files[0].filename}`
              : `chore: Adds ${files.length} media files`,
          owner,
          oid: oid ?? '',
          name: repoSlug,
          branch: repoBranch
        })

        const { media } = mediaData?.media || { media: [] }

        const commit = hashFromUrl(mediaData?.commitUrl ?? '')

        const newMedia: MediaItem[] = files.map(
          ({ filename, content: fileContents }) => {
            const newFilename = createMediaFilename(filename)
            const filePath = buildRepoMediaPath(source, newFilename)

            capi.replaceFile(filePath, fileContents, false)

            return {
              __outstatic: {
                hash: `${MurmurHash3(fileContents).result()}`,
                commit,
                path: `${filePath}`
              },
              filename: newFilename,
              type: getMediaTypeForFilename(newFilename, source),
              source: source.name,
              publishedAt: new Date().toISOString(),
              alt: ''
            }
          }
        )

        const mediaSchema = {
          commit,
          generated: new Date().toISOString(),
          media: media ?? []
        } as MediaSchema

        capi.replaceFile(
          mediaJsonPath,
          stringifyMedia({
            ...mediaSchema,
            media: [...(media ?? []), ...newMedia]
          })
        )

        const input = capi.createInput()
        await createCommit.mutateAsync(input)
        await refetchMedia()
      } catch (error) {
        console.error('Error submitting media:', error)
        throw error
      }
    },
    [
      repoOwner,
      session,
      createCommit,
      fetchOid,
      repoSlug,
      repoBranch,
      mediaJsonPath,
      refetchMedia
    ]
  )

  return onSubmit
}

export default useSubmitMedia
