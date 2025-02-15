import { FileType } from '@/types'
import { createCommitApi } from '@/utils/createCommitApi'
import { hashFromUrl } from '@/utils/hashFromUrl'
import { useOutstatic } from '@/utils/hooks/useOutstatic'
import { stringifyMedia } from '@/utils/metadata/stringify'
import MurmurHash3 from 'imurmurhash'
import { useCallback } from 'react'
import { useCreateCommit } from './useCreateCommit'
import useOid from './useOid'
import { useGetMediaFiles } from './useGetMediaFiles'
import { MediaSchema } from '../metadata/types'
import { toast } from 'sonner'

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
          mediaJsonPath,
          stringifyMedia({ ...mediaSchema, media: newMedia })
        )

        const input = capi.createInput()

        toast.promise(createCommit.mutateAsync(input), {
          loading: 'Uploading media...',
          success: async () => {
            await refetchMedia()
            return 'Media uploaded successfully'
          },
          error: 'Failed to upload media'
        })
        setLoading(false)
      } catch (error) {
        // TODO: Better error treatment
        setLoading(false)
        console.error('Error submitting media:', error)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      basePath,
      mediaJsonPath
    ]
  )

  return onSubmit
}

export default useSubmitMedia
