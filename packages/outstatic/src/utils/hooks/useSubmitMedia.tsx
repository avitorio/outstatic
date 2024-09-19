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
import { useQueryClient } from '@tanstack/react-query'

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
  const queryClient = useQueryClient()

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
          MEDIA_JSON_PATH,
          stringifyMedia({ ...mediaSchema, media: newMedia })
        )

        const input = capi.createInput()

        createCommit.mutate(input)
        queryClient.invalidateQueries({
          queryKey: ['media', { filePath: `${repoBranch}:${MEDIA_JSON_PATH}` }]
        })
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
