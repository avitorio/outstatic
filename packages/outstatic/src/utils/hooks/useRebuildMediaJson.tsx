import { useEffect, useState } from 'react'
import { useCallback } from 'react'
import { toast } from 'sonner'
import useOid from './useOid'
import useOutstatic, { useLocalData } from './useOutstatic'
import { useCreateCommit } from './useCreateCommit'
import { createCommitApi } from '../createCommitApi'
import { hashFromUrl } from '../hashFromUrl'
import { stringifyMedia } from '../metadata/stringify'
import { MediaSchema } from '../metadata/types'
import MurmurHash3 from 'imurmurhash'
import { useGetFiles } from './useGetFiles'

interface FileData {
  __outstatic: {
    hash: string
    path: string
    commit: string
  }
  filename: string
  type: string
  publishedAt: string
  alt: string
}

const isImage = (fileName: string) => {
  return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName)
}

export const useRebuildMediaJson = () => {
  const [total, setTotal] = useState(0)
  const [processed, setProcessed] = useState(0)
  const fetchOid = useOid()
  const mutation = useCreateCommit()
  const { data: localData } = useLocalData()
  const { repoOwner, repoSlug, repoBranch, ostPath } = useOutstatic()

  const { refetch, data } = useGetFiles({
    path: localData?.repoMediaPath || '',
    enabled: false
  })

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
      setTotal(0)
      setProcessed(0)
    }
  }, [processed, total])

  const rebuildMediaJson = useCallback(
    async ({
      onComplete
    }: {
      onComplete?: () => void
    } = {}) => {
      return new Promise((resolve, reject) => {
        toast.promise(
          refetch().then(({ data }) => {
            if (!data) {
              console.log('No data found')
              reject('No data found')
              return
            }

            const files = extractFiles(data)
            if (files.length === 0) {
              console.log('No files found')
              reject('No files found')
              return
            }

            return toast.promise(
              processFiles(files, () => onComplete?.()),
              {
                id: toastId,
                duration: 4000,
                loading: `Processing files...`,
                success: 'Files processed successfully',
                error: 'Error processing files'
              }
            )
          }),
          {
            loading: 'Fetching image files...',
            success: () => {
              resolve(undefined)
              return 'Images fetched successfully'
            },
            error: (err) => {
              reject(err)
              return 'Failed to fetch images'
            }
          }
        )
      })
    },
    [refetch]
  )

  const extractFiles = (data: any): FileData[] => {
    const object = data?.repository?.object
    const output: FileData[] = []
    const queue = object?.entries ? [...object.entries] : []
    while (queue.length > 0) {
      const nextEntry = queue.pop()
      if (nextEntry?.type === 'blob' && isImage(nextEntry.name)) {
        output.push({
          __outstatic: {
            hash: `${MurmurHash3().result()}`,
            commit: hashFromUrl(`${nextEntry.object.commitUrl}`),
            path: `${nextEntry.path}`
          },
          filename: `${nextEntry.name}`,
          type: 'image',
          publishedAt: new Date().toISOString(),
          alt: ''
        })
      }
    }
    return output
  }

  const processFiles = async (files: FileData[], onComplete?: () => void) => {
    setTotal(Math.max(files.length, 1))

    const pendingOid = fetchOid()

    const oid = await pendingOid

    if (files.length > 0 && oid) {
      const parentHash = hashFromUrl(
        // @ts-ignore
        data?.repository?.object?.commitUrl ?? ''
      )
      const database: MediaSchema = {
        commit: parentHash,
        generated: new Date().toUTCString(),
        media: files.filter(Boolean)
      }

      const commitApi = createCommitApi({
        message: 'chore: Updates media.json',
        owner: repoOwner,
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
    }
  }

  return rebuildMediaJson
}
