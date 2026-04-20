import { act, renderHook } from '@testing-library/react'
import { FileType } from '@/types'
import { createCommitApi } from '@/utils/create-commit-api'
import { hashFromUrl } from '@/utils/hash-from-url'
import { stringifyMedia } from '@/utils/metadata/stringify'
import { useGetMediaFiles } from './use-get-media-files'
import useOid from './use-oid'
import { useOutstatic } from './use-outstatic'
import { useCreateCommit } from './use-create-commit'
import useSubmitMedia from './use-submit-media'

jest.mock('@/utils/create-commit-api', () => ({
  createCommitApi: jest.fn()
}))

jest.mock('@/utils/hash-from-url', () => ({
  hashFromUrl: jest.fn()
}))

jest.mock('@/utils/metadata/stringify', () => ({
  stringifyMedia: jest.fn()
}))

jest.mock('./use-create-commit', () => ({
  useCreateCommit: jest.fn()
}))

jest.mock('./use-get-media-files', () => ({
  useGetMediaFiles: jest.fn()
}))

jest.mock('./use-oid', () => jest.fn())

jest.mock('./use-outstatic', () => ({
  useOutstatic: jest.fn()
}))

const mockCreateCommitApi = createCommitApi as jest.Mock
const mockHashFromUrl = hashFromUrl as jest.Mock
const mockStringifyMedia = stringifyMedia as jest.Mock
const mockUseCreateCommit = useCreateCommit as jest.Mock
const mockUseGetMediaFiles = useGetMediaFiles as jest.Mock
const mockUseOid = useOid as jest.Mock
const mockUseOutstatic = useOutstatic as jest.Mock

describe('useSubmitMedia', () => {
  const mutateAsync = jest.fn()
  const refetchMedia = jest.fn()
  const fetchOid = jest.fn()
  const replaceFile = jest.fn()
  const createInput = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()

    mockUseCreateCommit.mockReturnValue({ mutateAsync })
    mockUseGetMediaFiles.mockReturnValue({ refetch: refetchMedia })
    mockUseOid.mockReturnValue(fetchOid)
    mockUseOutstatic.mockReturnValue({
      repoOwner: 'owner',
      repoSlug: 'repo',
      repoBranch: 'main',
      repoMediaPath: 'media/',
      session: null,
      mediaJsonPath: 'outstatic/media/media.json'
    })
    mockCreateCommitApi.mockReturnValue({
      replaceFile,
      createInput
    })
    mockHashFromUrl.mockReturnValue('parent-hash')
    mockStringifyMedia.mockReturnValue('serialized-media')

    fetchOid.mockResolvedValue('oid-123')
    refetchMedia
      .mockResolvedValueOnce({
        data: {
          media: {
            media: [
              {
                __outstatic: {
                  hash: 'existing-hash',
                  commit: 'existing-commit',
                  path: 'media/existing.png'
                },
                filename: 'existing.png',
                type: 'image',
                publishedAt: '2024-01-01T00:00:00.000Z',
                alt: ''
              }
            ]
          },
          commitUrl: 'https://example.com/commit/123'
        },
        isError: false
      })
      .mockResolvedValueOnce({
        data: {
          media: {
            media: []
          },
          commitUrl: 'https://example.com/commit/124'
        },
        isError: false
      })
    mutateAsync.mockResolvedValue(undefined)
    createInput.mockReturnValue({ input: 'payload' })

    jest
      .spyOn(window, 'btoa')
      .mockReturnValueOnce('abcdefghij')
      .mockReturnValueOnce('klmnopqrst')
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('submits multiple media files in a single commit and updates media.json once', async () => {
    const files: FileType[] = [
      {
        filename: 'Photo.png',
        type: 'image',
        content: 'image-one'
      },
      {
        filename: 'Second Image.png',
        type: 'image',
        content: 'image-two'
      }
    ]

    const { result } = renderHook(() => useSubmitMedia())

    await act(async () => {
      await result.current(files)
    })

    expect(fetchOid).toHaveBeenCalledTimes(1)
    expect(refetchMedia).toHaveBeenCalledTimes(2)
    expect(mockCreateCommitApi).toHaveBeenCalledWith({
      message: 'chore: Adds 2 media files',
      owner: 'owner',
      oid: 'oid-123',
      name: 'repo',
      branch: 'main'
    })
    expect(replaceFile).toHaveBeenNthCalledWith(
      1,
      'media/photo-ghij.png',
      'image-one',
      false
    )
    expect(replaceFile).toHaveBeenNthCalledWith(
      2,
      'media/second-image-qrst.png',
      'image-two',
      false
    )
    expect(replaceFile).toHaveBeenNthCalledWith(
      3,
      'outstatic/media/media.json',
      'serialized-media'
    )
    expect(mockStringifyMedia).toHaveBeenCalledWith(
      expect.objectContaining({
        commit: 'parent-hash',
        media: expect.arrayContaining([
          expect.objectContaining({
            filename: 'existing.png'
          }),
          expect.objectContaining({
            filename: 'photo-ghij.png',
            type: 'image',
            __outstatic: expect.objectContaining({
              commit: 'parent-hash',
              path: 'media/photo-ghij.png'
            })
          }),
          expect.objectContaining({
            filename: 'second-image-qrst.png',
            type: 'image',
            __outstatic: expect.objectContaining({
              commit: 'parent-hash',
              path: 'media/second-image-qrst.png'
            })
          })
        ])
      })
    )
    expect(createInput).toHaveBeenCalledTimes(1)
    expect(mutateAsync).toHaveBeenCalledWith({ input: 'payload' })
  })
})
