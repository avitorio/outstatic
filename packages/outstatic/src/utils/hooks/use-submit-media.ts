import { FileType } from '@/types'
import { createCommitApi } from '@/utils/create-commit-api'
import { hashFromUrl } from '@/utils/hash-from-url'
import { useOutstatic } from '@/utils/hooks/use-outstatic'
import { stringifyMedia } from '@/utils/metadata/stringify'
import MurmurHash3 from 'imurmurhash'
import { useCallback } from 'react'
import { useCreateCommit } from './use-create-commit'
import useOid from './use-oid'
import { useGetMediaFiles } from './use-get-media-files'
import { MediaSchema } from '../metadata/types'

function useSubmitMedia() {
  const createCommit = useCreateCommit()
  const {
    repoOwner,
    repoSlug,
    repoBranch,
    repoMediaPath,
    session,
    mediaJsonPath
  } = useOutstatic()
  const fetchOid = useOid()

  const { refetch: refetchMedia } = useGetMediaFiles({
    enabled: false
  })

  const onSubmit = useCallback(
    async (file: FileType) => {
      const { filename, type, content: fileContents } = file
      try {
        const oid = await fetchOid()
        const owner = repoOwner || session?.user?.login || ''

        const capi = createCommitApi({
          message: `chore: Adds ${filename}`,
          owner,
          oid: oid ?? '',
          name: repoSlug,
          branch: repoBranch
        })

        // Add a random string to ensure uniqueness and prevent overwriting
        const randString = window
          .btoa(Math.random().toString())
          .substring(10, 6)

        const newFilename = filename
          .toLowerCase()
          .replace(/[^a-zA-Z0-9-_\.]/g, '-')
          .replace(/(\.[^\.]*)?$/, `-${randString}$1`)

        const filePath = `${repoMediaPath}${newFilename}`

        capi.replaceFile(filePath, fileContents, false)

        const { data: mediaData, isError } = await refetchMedia()

        if (isError) {
          throw new Error('Error fetching media data')
        }

        const { media } = mediaData?.media || { media: [] }

        const commit = hashFromUrl(mediaData?.commitUrl ?? '')

        const newMedia = [
          ...(media ?? []),
          {
            __outstatic: {
              hash: `${MurmurHash3(fileContents).result()}`,
              commit,
              path: `${filePath}`
            },
            filename: newFilename,
            type: type,
            publishedAt: new Date().toISOString(),
            alt: ''
          }
        ]

        const mediaSchema = {
          commit,
          generated: new Date().toISOString(),
          media: media ?? []
        } as MediaSchema

        capi.replaceFile(
          mediaJsonPath,
          stringifyMedia({ ...mediaSchema, media: newMedia })
        )

        const input = capi.createInput()
        await createCommit.mutateAsync(input)
        await refetchMedia()
      } catch (error) {
        console.error('Error submitting media:', error)
        throw error
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
