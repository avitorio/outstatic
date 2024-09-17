import { createCommitApi } from '@/utils/createCommitApi'
import useOutstatic, { useLocalData } from '@/utils/hooks/useOutstatic'
import { useCallback } from 'react'
import { useCreateCommit } from './useCreateCommit'
import useOid from './useOid'
import { useGetConfig } from './useGetConfig'
import { ConfigType } from '../metadata/types'
import { CONFIG_JSON_PATH } from '../constants'
import stringify from 'json-stable-stringify'
import { toast } from 'sonner'

type SubmitDocumentProps = {
  setLoading: (loading: boolean) => void
}

export function useUpdateConfig({ setLoading }: SubmitDocumentProps) {
  const createCommit = useCreateCommit()
  const { setData } = useLocalData()
  const { repoOwner, repoSlug, repoBranch, session } = useOutstatic()
  const fetchOid = useOid()

  const { refetch } = useGetConfig({
    enabled: false
  })

  const onSubmit = useCallback(
    async (configFields: ConfigType) => {
      setLoading(true)
      try {
        const oid = await fetchOid()
        const owner = repoOwner || session?.user?.login || ''

        const capi = createCommitApi({
          message: `chore: Updates config`,
          owner,
          oid: oid ?? '',
          name: repoSlug,
          branch: repoBranch
        })

        const { data: config } = await refetch()

        if (!config) throw new Error("Couldn't fetch config data")

        const updatedConfig = {
          ...config,
          ...configFields
        }

        capi.replaceFile(
          CONFIG_JSON_PATH,
          stringify(updatedConfig, { space: 2 })
        )

        const input = capi.createInput()

        toast.promise(createCommit.mutateAsync(input), {
          loading: 'Updating config...',
          success: 'Config updated successfully',
          error: 'Failed to update config'
        })

        setData({
          repoMediaPath: updatedConfig.repoMediaPath,
          publicMediaPath: updatedConfig.publicMediaPath
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
      fetchOid,
      repoSlug,
      repoBranch
    ]
  )

  return onSubmit
}
