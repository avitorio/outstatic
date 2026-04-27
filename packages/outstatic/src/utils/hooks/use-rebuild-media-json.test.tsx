import { act, renderHook } from '@testing-library/react'
import { toast } from 'sonner'
import { createCommitApi } from '../create-commit-api'
import { hashFromUrl } from '../hash-from-url'
import { stringifyMedia } from '../metadata/stringify'
import useOid from './use-oid'
import { useOutstatic } from './use-outstatic'
import { useCreateCommit } from './use-create-commit'
import { useRebuildMediaJson } from './use-rebuild-media-json'

jest.mock('sonner', () => ({
  toast: {
    dismiss: jest.fn(),
    loading: jest.fn(),
    promise: jest.fn()
  }
}))

jest.mock('../create-commit-api', () => ({
  createCommitApi: jest.fn()
}))

jest.mock('../hash-from-url', () => ({
  hashFromUrl: jest.fn()
}))

jest.mock('../metadata/stringify', () => ({
  stringifyMedia: jest.fn()
}))

jest.mock('./use-create-commit', () => ({
  useCreateCommit: jest.fn()
}))

jest.mock('./use-oid', () => jest.fn())

jest.mock('./use-outstatic', () => ({
  useOutstatic: jest.fn()
}))

const mockToastPromise = toast.promise as jest.Mock
const mockCreateCommitApi = createCommitApi as jest.Mock
const mockHashFromUrl = hashFromUrl as jest.Mock
const mockStringifyMedia = stringifyMedia as jest.Mock
const mockUseCreateCommit = useCreateCommit as jest.Mock
const mockUseOid = useOid as jest.Mock
const mockUseOutstatic = useOutstatic as jest.Mock

describe('useRebuildMediaJson', () => {
  const fetchOid = jest.fn()
  const mutateAsync = jest.fn()
  const replaceFile = jest.fn()
  const createInput = jest.fn()
  const gqlRequest = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()

    mockToastPromise.mockImplementation(
      async (
        promise: Promise<unknown>,
        messages?: {
          success?: string | (() => string)
          error?: string | ((error: unknown) => string)
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
    mockUseOid.mockReturnValue(fetchOid)
    mockUseCreateCommit.mockReturnValue({ mutateAsync })
    mockUseOutstatic.mockReturnValue({
      gqlClient: {
        request: gqlRequest
      },
      repoOwner: 'owner',
      repoSlug: 'repo',
      repoBranch: 'main',
      ostPath: 'outstatic',
      media: [
        {
          name: 'images',
          label: 'Images',
          input: 'media/images',
          output: '/images',
          categories: ['image']
        },
        {
          name: 'docs',
          label: 'Docs',
          input: 'media/docs',
          output: '/docs',
          categories: ['document']
        }
      ],
      session: null
    })
    mockCreateCommitApi.mockReturnValue({
      replaceFile,
      createInput
    })
    mockHashFromUrl.mockImplementation((value: string) => `hash:${value}`)
    mockStringifyMedia.mockReturnValue('serialized-media')
    fetchOid.mockResolvedValue('oid-123')
    mutateAsync.mockResolvedValue(undefined)
    createInput.mockReturnValue({ input: 'payload' })
  })

  it('rebuilds media.json when all source fetches succeed', async () => {
    gqlRequest
      .mockResolvedValueOnce({
        repository: {
          object: {
            commitUrl: 'https://example.com/commit/images',
            entries: [
              {
                path: 'media/images/photo.png',
                name: 'photo.png',
                type: 'blob',
                object: {
                  commitUrl: 'https://example.com/commit/photo'
                }
              },
              {
                path: 'media/images/notes.txt',
                name: 'notes.txt',
                type: 'blob',
                object: {
                  commitUrl: 'https://example.com/commit/notes'
                }
              }
            ]
          }
        }
      })
      .mockResolvedValueOnce({
        repository: {
          object: {
            commitUrl: 'https://example.com/commit/docs',
            entries: [
              {
                path: 'media/docs/manual.pdf',
                name: 'manual.pdf',
                type: 'blob',
                object: {
                  commitUrl: 'https://example.com/commit/manual'
                }
              },
              {
                path: 'media/docs/thumbnail.png',
                name: 'thumbnail.png',
                type: 'blob',
                object: {
                  commitUrl: 'https://example.com/commit/thumbnail'
                }
              }
            ]
          }
        }
      })

    const { result } = renderHook(() => useRebuildMediaJson())

    await act(async () => {
      await result.current()
    })

    expect(mockCreateCommitApi).toHaveBeenCalledWith({
      message: 'chore: Updates media.json',
      owner: 'owner',
      name: 'repo',
      branch: 'main',
      oid: 'oid-123'
    })
    expect(mockStringifyMedia).toHaveBeenCalledWith({
      commit: 'hash:https://example.com/commit/images',
      generated: expect.any(String),
      media: [
        expect.objectContaining({
          filename: 'photo.png',
          source: 'images',
          __outstatic: expect.objectContaining({
            commit: 'hash:https://example.com/commit/photo',
            path: 'media/images/photo.png'
          })
        }),
        expect.objectContaining({
          filename: 'manual.pdf',
          source: 'docs',
          __outstatic: expect.objectContaining({
            commit: 'hash:https://example.com/commit/manual',
            path: 'media/docs/manual.pdf'
          })
        })
      ]
    })
    expect(replaceFile).toHaveBeenCalledWith(
      'outstatic/media/media.json',
      'serialized-media'
    )
    expect(mutateAsync).toHaveBeenCalledWith({ input: 'payload' })
  })

  it('fails rebuild without rewriting media.json when one source fetch fails', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    gqlRequest
      .mockResolvedValueOnce({
        repository: {
          object: {
            commitUrl: 'https://example.com/commit/images',
            entries: [
              {
                path: 'media/images/photo.png',
                name: 'photo.png',
                type: 'blob',
                object: {
                  commitUrl: 'https://example.com/commit/photo'
                }
              }
            ]
          }
        }
      })
      .mockRejectedValueOnce(new Error('Missing folder'))

    const { result } = renderHook(() => useRebuildMediaJson())

    let rebuildError: Error | undefined

    await act(async () => {
      try {
        await result.current()
      } catch (error) {
        rebuildError = error as Error
      }
    })

    expect(rebuildError).toBeInstanceOf(Error)
    expect(rebuildError?.message).toBe(
      'Failed to rebuild media library because one or more sources could not be loaded: "docs" (Missing folder). media.json was not updated.'
    )
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to fetch media files for source "docs".',
      expect.any(Error)
    )
    expect(mockCreateCommitApi).not.toHaveBeenCalled()
    expect(mockStringifyMedia).not.toHaveBeenCalled()
    expect(replaceFile).not.toHaveBeenCalled()
    expect(mutateAsync).not.toHaveBeenCalled()
    expect(mockToastPromise).toHaveBeenCalledTimes(1)
    expect(mockToastPromise.mock.calls[0]?.[1]?.error?.(rebuildError)).toBe(
      rebuildError?.message
    )

    consoleErrorSpy.mockRestore()
  })

  it('fails rebuild without rewriting media.json when a source folder is missing', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    gqlRequest
      .mockResolvedValueOnce({
        repository: {
          object: {
            commitUrl: 'https://example.com/commit/images',
            entries: [
              {
                path: 'media/images/photo.png',
                name: 'photo.png',
                type: 'blob',
                object: {
                  commitUrl: 'https://example.com/commit/photo'
                }
              }
            ]
          }
        }
      })
      .mockResolvedValueOnce({
        repository: {
          object: null
        }
      })

    const { result } = renderHook(() => useRebuildMediaJson())

    let rebuildError: Error | undefined

    await act(async () => {
      try {
        await result.current()
      } catch (error) {
        rebuildError = error as Error
      }
    })

    expect(rebuildError).toBeInstanceOf(Error)
    expect(rebuildError?.message).toBe(
      'Failed to rebuild media library because one or more sources could not be loaded: "docs" (Media source "docs" could not be loaded.). media.json was not updated.'
    )
    expect(mockCreateCommitApi).not.toHaveBeenCalled()
    expect(mockStringifyMedia).not.toHaveBeenCalled()
    expect(replaceFile).not.toHaveBeenCalled()
    expect(mutateAsync).not.toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
  })
})
