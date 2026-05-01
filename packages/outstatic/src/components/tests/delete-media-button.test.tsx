import { DeleteMediaButton } from '@/components/delete-media-button'
import { TestWrapper } from '@/utils/tests/test-wrapper'
import { stringifyMedia } from '@/utils/metadata/stringify'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

const mockRemoveFile = jest.fn()
const mockReplaceFile = jest.fn()
const mockCreateInput = jest.fn()
const mockRefetchMedia = jest.fn()
const mockToastError = jest.fn()
const mockToastPromise = jest.fn(
  async (
    promise: Promise<unknown>,
    options?: { success?: string | (() => string | Promise<string>) }
  ) => {
    const value = await promise

    if (typeof options?.success === 'function') {
      await options.success()
    }

    return value
  }
)

// Mock the useOutstatic hook
jest.mock('@/utils/hooks/use-outstatic', () => ({
  __esModule: true,
  useOutstatic: () => ({
    repoOwner: 'testOwner',
    repoSlug: 'testRepo',
    repoBranch: 'main',
    mediaJsonPath: 'outstatic/media/media.json',
    ostContent: {},
    session: { user: { login: 'testUser' } }
  })
}))

// Mock useOid hook
jest.mock('@/utils/hooks/use-oid', () => () => jest.fn().mockReturnValue('123'))

// Mock useGetMediaFiles hook
jest.mock('@/utils/hooks/use-get-media-files', () => ({
  useGetMediaFiles: () => ({
    refetch: mockRefetchMedia
  })
}))

jest.mock('sonner', () => ({
  toast: {
    error: (message: string) => mockToastError(message),
    promise: (promise: Promise<unknown>, options: unknown) =>
      mockToastPromise(promise, options as never)
  }
}))

jest.mock('@/utils/hooks/use-create-commit', () => ({
  useCreateCommit: () => ({
    mutate: async () => Promise.resolve(true),
    mutateAsync: async () => Promise.resolve(true)
  })
}))

// Mock createCommitApi
jest.mock('@/utils/create-commit-api', () => ({
  createCommitApi: () => ({
    removeFile: mockRemoveFile,
    replaceFile: mockReplaceFile,
    createInput: mockCreateInput
  })
}))

jest.mock('@/utils/metadata/stringify', () => ({
  stringifyMedia: jest.fn(() => 'serialized-media')
}))

beforeEach(() => {
  jest.clearAllMocks()
  mockRefetchMedia.mockResolvedValue({
    data: {
      media: {
        media: [
          {
            filename: 'test-image.jpg',
            __outstatic: {
              path: '/media/test-image.jpg'
            }
          },
          {
            filename: 'test-image.jpg',
            __outstatic: {
              path: '/other/test-image.jpg'
            }
          }
        ]
      },
      commitUrl: ''
    }
  })
})

test('DeleteMediaButton renders and operates correctly', async () => {
  const onComplete = jest.fn()
  const mockStringifyMedia = stringifyMedia as jest.Mock

  mockCreateInput.mockReturnValue({ input: 'payload' })

  render(
    <TestWrapper>
      <DeleteMediaButton
        path="/media/test-image.jpg"
        filename="test-image.jpg"
        onComplete={onComplete}
      />
    </TestWrapper>
  )

  // Check if button is in the document
  expect(screen.getByTitle('Delete media file')).toBeInTheDocument()

  // Simulate clicking the delete button
  fireEvent.click(screen.getByTitle('Delete media file'))

  // Check if modal shows up
  expect(screen.getByText('Delete Media')).toBeInTheDocument()

  // Simulate clicking the delete button in the modal
  fireEvent.click(screen.getByText('Delete'))

  // Check if onComplete is called
  await waitFor(() => expect(onComplete).toHaveBeenCalled())
  expect(mockRemoveFile).toHaveBeenCalledWith('/media/test-image.jpg')
  expect(mockStringifyMedia).toHaveBeenCalledWith(
    expect.objectContaining({
      media: [
        expect.objectContaining({
          filename: 'test-image.jpg',
          __outstatic: expect.objectContaining({
            path: '/other/test-image.jpg'
          })
        })
      ]
    })
  )
  expect(mockReplaceFile).toHaveBeenCalledWith(
    'outstatic/media/media.json',
    'serialized-media'
  )

  // Simulate clicking the delete button again
  fireEvent.click(screen.getByTitle('Delete media file'))

  // Simulate clicking the cancel button in the modal
  fireEvent.click(screen.getByText('Cancel'))

  // Check if modal closes
  await waitFor(() =>
    expect(screen.queryByText('Delete Document')).not.toBeInTheDocument()
  )
})

test('DeleteMediaButton shows a toast when media lookup fails before registering the promise toast', async () => {
  const consoleErrorSpy = jest
    .spyOn(console, 'error')
    .mockImplementation(() => {})

  mockRefetchMedia.mockRejectedValueOnce(new Error('Failed to fetch media'))

  render(
    <TestWrapper>
      <DeleteMediaButton
        path="/media/test-image.jpg"
        filename="test-image.jpg"
      />
    </TestWrapper>
  )

  fireEvent.click(screen.getByTitle('Delete media file'))
  fireEvent.click(screen.getByText('Delete'))

  await waitFor(() =>
    expect(mockToastError).toHaveBeenCalledWith('Failed to delete media')
  )
  expect(mockToastPromise).not.toHaveBeenCalled()
  expect(mockCreateInput).not.toHaveBeenCalled()

  consoleErrorSpy.mockRestore()
})
