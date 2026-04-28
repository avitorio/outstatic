import { act, renderHook, waitFor } from '@testing-library/react'
import { toast } from 'sonner'
import { createCommitApi } from '@/utils/create-commit-api'
import { useCreateCommit } from './use-create-commit'
import { useGetConfig } from './use-get-config'
import useOid from './use-oid'
import { useLocalData, useOutstatic } from './use-outstatic'
import { useRebuildMediaJson } from './use-rebuild-media-json'
import { useUpdateConfig } from './use-update-config'
import { MediaSourceConfig } from '../metadata/types'

jest.mock('sonner', () => ({
  toast: {
    promise: jest.fn()
  }
}))

jest.mock('@/utils/create-commit-api', () => ({
  createCommitApi: jest.fn()
}))

jest.mock('./use-create-commit', () => ({
  useCreateCommit: jest.fn()
}))

jest.mock('./use-get-config', () => ({
  useGetConfig: jest.fn()
}))

jest.mock('./use-oid', () => jest.fn())

jest.mock('./use-outstatic', () => ({
  useLocalData: jest.fn(),
  useOutstatic: jest.fn()
}))

jest.mock('./use-rebuild-media-json', () => ({
  useRebuildMediaJson: jest.fn()
}))

const mockToastPromise = toast.promise as jest.Mock
const mockCreateCommitApi = createCommitApi as jest.Mock
const mockUseCreateCommit = useCreateCommit as jest.Mock
const mockUseGetConfig = useGetConfig as jest.Mock
const mockUseOid = useOid as jest.Mock
const mockUseLocalData = useLocalData as jest.Mock
const mockUseOutstatic = useOutstatic as jest.Mock
const mockUseRebuildMediaJson = useRebuildMediaJson as jest.Mock

describe('useUpdateConfig', () => {
  const createInput = jest.fn()
  const fetchOid = jest.fn()
  const mutateAsync = jest.fn()
  const onComplete = jest.fn()
  const rebuildMediaJson = jest.fn()
  const refetchConfig = jest.fn()
  const replaceFile = jest.fn()
  const setData = jest.fn()
  const setLoading = jest.fn()

  const existingSource: MediaSourceConfig = {
    name: 'old-images',
    label: 'Old Images',
    input: 'media/old',
    output: '/old',
    categories: ['image']
  }

  const nextSource: MediaSourceConfig = {
    name: 'new-images',
    label: 'New Images',
    input: 'media/new',
    output: '/new',
    categories: ['image']
  }

  beforeEach(() => {
    jest.clearAllMocks()

    mockToastPromise.mockImplementation(
      async (
        promise: Promise<unknown>,
        messages?: {
          error?: string | ((error: unknown) => string)
          success?: string | (() => string)
        }
      ) => {
        try {
          const value = await promise

          if (typeof messages?.success === 'function') {
            messages.success()
          }

          return value
        } catch (error) {
          if (typeof messages?.error === 'function') {
            messages.error(error)
          }

          throw error
        }
      }
    )
    mockCreateCommitApi.mockReturnValue({
      createInput,
      replaceFile
    })
    mockUseCreateCommit.mockReturnValue({ mutateAsync })
    mockUseGetConfig.mockReturnValue({ refetch: refetchConfig })
    mockUseLocalData.mockReturnValue({ setData })
    mockUseOid.mockReturnValue(fetchOid)
    mockUseOutstatic.mockReturnValue({
      configJsonPath: 'outstatic/config.json',
      repoBranch: 'main',
      repoOwner: 'owner',
      repoSlug: 'repo',
      session: null
    })
    mockUseRebuildMediaJson.mockReturnValue(rebuildMediaJson)

    createInput.mockReturnValue({ input: 'payload' })
    fetchOid.mockResolvedValue('oid-123')
    mutateAsync.mockResolvedValue(undefined)
    onComplete.mockReturnValue(undefined)
    rebuildMediaJson.mockImplementation(
      async ({ onComplete }: { onComplete?: () => void } = {}) => {
        onComplete?.()
      }
    )
    refetchConfig.mockResolvedValue({
      data: {
        media: [existingSource],
        publicMediaPath: '/old/',
        repoMediaPath: 'media/old/'
      },
      isError: false
    })
  })

  it('rebuilds media.json with the media sources from the saved config', async () => {
    const { result } = renderHook(() => useUpdateConfig({ setLoading }))

    await act(async () => {
      await result.current({
        configFields: {
          media: [nextSource]
        },
        callbackFunction: onComplete
      })
    })

    await waitFor(() => {
      expect(rebuildMediaJson).toHaveBeenCalledWith({
        onComplete,
        sources: [
          expect.objectContaining({
            input: 'media/new',
            name: 'new-images',
            output: '/new'
          })
        ]
      })
    })
    expect(rebuildMediaJson).not.toHaveBeenCalledWith(
      expect.objectContaining({
        sources: [expect.objectContaining({ name: 'old-images' })]
      })
    )
    expect(onComplete).toHaveBeenCalled()
  })

  it('does not rebuild media.json for non-media config updates', async () => {
    const { result } = renderHook(() => useUpdateConfig({ setLoading }))

    await act(async () => {
      await result.current({
        configFields: {
          mdExtension: 'mdx'
        },
        callbackFunction: onComplete
      })
    })

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled()
    })
    expect(rebuildMediaJson).not.toHaveBeenCalled()
  })
})
