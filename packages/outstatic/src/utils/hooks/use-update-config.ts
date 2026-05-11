import { createCommitApi } from '@/utils/create-commit-api'
import { createOutstaticCommitMessage } from '@/utils/commit-message'
import { useOutstatic, useLocalData } from '@/utils/hooks/use-outstatic'
import { useCallback, useState, useEffect, useRef } from 'react'
import { useCreateCommit } from './use-create-commit'
import useOid from './use-oid'
import { useGetConfig } from './use-get-config'
import { ConfigType, MediaSourceConfig } from '../metadata/types'
import stringify from 'json-stable-stringify'
import { toast } from 'sonner'
import { useRebuildMediaJson } from './use-rebuild-media-json'
import { resolveMediaSources, syncLegacyMediaFields } from '../media-config'

type SubmitDocumentProps = {
  setLoading: (loading: boolean) => void
}

type OnSubmitProps = {
  configFields: Partial<ConfigType>
  callbackFunction?: () => void
}

type PendingMediaRebuild = {
  onComplete?: () => void
  sources: MediaSourceConfig[]
}

const hasOwnConfigField = (
  configFields: Partial<ConfigType>,
  field: keyof ConfigType
) => Object.prototype.hasOwnProperty.call(configFields, field)

export function useUpdateConfig({ setLoading }: SubmitDocumentProps) {
  const createCommit = useCreateCommit()
  const { setData } = useLocalData()
  const { repoOwner, repoSlug, repoBranch, session, configJsonPath } =
    useOutstatic()
  const fetchOid = useOid()

  const { refetch } = useGetConfig({
    enabled: false
  })

  const pendingMediaRebuildRef = useRef<PendingMediaRebuild | null>(null)
  const [mediaRebuildRequest, setMediaRebuildRequest] = useState(0)

  const rebuildMediaJson = useRebuildMediaJson()

  useEffect(() => {
    if (mediaRebuildRequest === 0) {
      return
    }

    const pendingMediaRebuild = pendingMediaRebuildRef.current

    if (!pendingMediaRebuild) {
      return
    }

    const execute = async () => {
      try {
        await rebuildMediaJson({
          sources: pendingMediaRebuild.sources,
          onComplete: pendingMediaRebuild.onComplete
        })
      } finally {
        pendingMediaRebuildRef.current = null
        setLoading(false)
      }
    }

    void execute()
  }, [mediaRebuildRequest, rebuildMediaJson, setLoading])

  const onSubmit = useCallback(
    async ({ configFields, callbackFunction }: OnSubmitProps) => {
      setLoading(true)
      try {
        const oid = await fetchOid()
        const owner = repoOwner || session?.user?.login || ''

        const commitApi = createCommitApi({
          message: createOutstaticCommitMessage({
            scope: 'config',
            action: 'update',
            target: 'settings'
          }),
          owner,
          oid: oid ?? '',
          name: repoSlug,
          branch: repoBranch
        })

        const { data: config, isError } = await refetch()

        if (isError) {
          throw new Error('Failed to fetch config')
        }

        const nextConfig = {
          ...(config ?? {}),
          ...configFields
        }
        const updatedConfig = nextConfig.media
          ? syncLegacyMediaFields(nextConfig)
          : nextConfig
        const shouldRebuildMedia =
          hasOwnConfigField(configFields, 'media') ||
          hasOwnConfigField(configFields, 'repoMediaPath') ||
          hasOwnConfigField(configFields, 'publicMediaPath')
        const mediaSourcesForRebuild = shouldRebuildMedia
          ? resolveMediaSources(updatedConfig)
          : []

        commitApi.replaceFile(
          configJsonPath,
          // @ts-ignore
          stringify(updatedConfig, { space: 2 })
        )

        const input = commitApi.createInput()

        toast.promise(createCommit.mutateAsync(input), {
          loading: 'Updating config...',
          success: () => {
            setData({
              media: updatedConfig.media ?? [],
              repoMediaPath: updatedConfig.repoMediaPath,
              publicMediaPath: updatedConfig.publicMediaPath
            })

            if (mediaSourcesForRebuild.length > 0) {
              pendingMediaRebuildRef.current = {
                sources: mediaSourcesForRebuild,
                onComplete: callbackFunction
              }
              setMediaRebuildRequest((current) => current + 1)
            } else {
              callbackFunction?.()
              setLoading(false)
            }

            return 'Config updated successfully'
          },
          error: () => {
            setLoading(false)
            return 'Failed to update config'
          }
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
      repoBranch,
      configJsonPath,
      fetchOid,
      setData
    ]
  )

  return onSubmit
}
