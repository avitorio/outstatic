import { createCommitApi } from '@/utils/createCommitApi'
import { useOutstatic, useLocalData } from '@/utils/hooks/useOutstatic'
import { useCallback, useState, useEffect } from 'react'
import { useCreateCommit } from './useCreateCommit'
import useOid from './useOid'
import { useGetConfig } from './useGetConfig'
import { ConfigType } from '../metadata/types'
import stringify from 'json-stable-stringify'
import { toast } from 'sonner'
import { useRebuildMediaJson } from './useRebuildMediaJson'

type SubmitDocumentProps = {
  setLoading: (loading: boolean) => void
}

type OnSubmitProps = {
  configFields: Partial<ConfigType>
  callbackFunction?: () => void
}

export function useUpdateConfig({ setLoading }: SubmitDocumentProps) {
  const createCommit = useCreateCommit()
  const { setData } = useLocalData()
  const { repoOwner, repoSlug, repoBranch, session, configJsonPath } =
    useOutstatic()
  const fetchOid = useOid()

  const { refetch } = useGetConfig({
    enabled: false
  })

  const [callback, setCallback] = useState<() => void | undefined>(
    () => undefined
  )
  const [shouldRebuildMedia, setShouldRebuildMedia] = useState(false)

  const rebuildMediaJson = useRebuildMediaJson()

  useEffect(() => {
    if (shouldRebuildMedia) {
      const execute = async () => {
        await rebuildMediaJson({ onComplete: () => callback() })
      }
      execute()
    }
  }, [shouldRebuildMedia, callback])

  const onSubmit = useCallback(
    async ({ configFields, callbackFunction }: OnSubmitProps) => {
      setLoading(true)
      try {
        const oid = await fetchOid()
        const owner = repoOwner || session?.user?.login || ''

        const commitApi = createCommitApi({
          message: `chore: Updates config`,
          owner,
          oid: oid ?? '',
          name: repoSlug,
          branch: repoBranch
        })

        const { data: config, isError } = await refetch()

        if (isError) {
          throw new Error('Failed to fetch config')
        }

        const updatedConfig = {
          ...(config ?? {}),
          ...configFields
        }

        commitApi.replaceFile(
          configJsonPath,
          stringify(updatedConfig, { space: 2 })
        )

        const input = commitApi.createInput()

        toast.promise(createCommit.mutateAsync(input), {
          loading: 'Updating config...',
          success: () => {
            setData({
              repoMediaPath: updatedConfig.repoMediaPath,
              publicMediaPath: updatedConfig.publicMediaPath
            })

            if (callbackFunction) {
              setCallback(() => callbackFunction)
            }

            setShouldRebuildMedia(!!updatedConfig.repoMediaPath)

            return 'Config updated successfully'
          },
          error: 'Failed to update config'
        })
      } catch (error) {
        // TODO: Better error treatment
        setLoading(false)
        console.error('Error submitting media:', error)
      }
    },
    [
      refetch,
      repoOwner,
      session,
      setLoading,
      createCommit,
      repoSlug,
      repoBranch
    ]
  )

  return onSubmit
}
