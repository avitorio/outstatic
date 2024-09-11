import { FileType } from '@/types'
import { createCommitApi } from '@/utils/createCommitApi'
import { hashFromUrl } from '@/utils/hashFromUrl'
import useOutstatic from '@/utils/hooks/useOutstatic'
import { stringifyMedia } from '@/utils/metadata/stringify'
import MurmurHash3 from 'imurmurhash'
import { useCallback } from 'react'
import { useCreateCommit } from './useCreateCommit'
import useOid from './useOid'
import { useGetMediaFiles } from './useGetMediaFiles'
import { MediaSchema } from '../metadata/types'
import { MEDIA_JSON_PATH } from '../constants'

type SubmitDocumentProps = {
  setLoading: (loading: boolean) => void
  file: FileType
}

function useSubmitMedia({ setLoading, file }: SubmitDocumentProps) {
  const createCommit = useCreateCommit()
  const {
    repoOwner,
    repoSlug,
    repoBranch,
    monorepoPath,
    ostContent,
    contentPath,
    basePath,
    repoMediaPath,
    session
  } = useOutstatic()
  const fetchOid = useOid()

  const { refetch: refetchMedia } = useGetMediaFiles({
    enabled: false
  })

  const onSubmit = useCallback(
    async (file: FileType) => {
      const { filename, type, content: fileContents } = file
      setLoading(true)
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

        const filePath = `${
          monorepoPath ? monorepoPath + '/' : ''
        }${repoMediaPath}${newFilename}`

        capi.replaceFile(filePath, fileContents, false)

        const { data: mediaData } = await refetchMedia()

        if (!mediaData) throw new Error("Couldn't fetch media data")

        const { media } = mediaData?.media

        const commit = hashFromUrl(mediaData.commitUrl)

        const newMedia = [
          ...(media ?? []),
          {
            __outstatic: {
              hash: `${MurmurHash3(fileContents).result()}`,
              commit,
              path: `${filePath}${newFilename}`
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
          MEDIA_JSON_PATH,
          stringifyMedia({ ...mediaSchema, media: newMedia })
        )

        const input = capi.createInput()

        createCommit.mutate(input)
        await refetchMedia() // Refetch media to update the cache
        setLoading(false)
      } catch (error) {
        // TODO: Better error treatment
        setLoading(false)
        console.error('Error submitting media:', error)
      }
    },
    [
      repoOwner,
      session,
      setLoading,
      file,
      createCommit,
      fetchOid,
      monorepoPath,
      contentPath,
      ostContent,
      repoSlug,
      repoBranch,
      basePath
    ]
  )

  return onSubmit
}

export default useSubmitMedia
