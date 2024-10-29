import { DeleteMediaButton } from './index'
import { TestWrapper } from '@/utils/TestWrapper'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

// Mock the useOutstatic hook
jest.mock('@/utils/hooks/useOutstatic', () => ({
  __esModule: true,
  default: () => ({
    repoOwner: 'testOwner',
    repoSlug: 'testRepo',
    repoBranch: 'main',
    ostContent: {},
    session: { user: { login: 'testUser' } }
  })
}))

// Mock useOid hook
jest.mock('@/utils/hooks/useOid', () => () => jest.fn().mockReturnValue('123'))

// Mock useGetMediaFiles hook
jest.mock('@/utils/hooks/useGetMediaFiles', () => ({
  useGetMediaFiles: () => ({
    refetch: async () =>
      Promise.resolve({
        data: {
          media: { media: [{ filename: 'test-image.jpg' }] },
          commitUrl: ''
        }
      })
  })
}))

jest.mock('@/utils/hooks/useCreateCommit', () => ({
  useCreateCommit: () => ({
    mutate: async () => Promise.resolve(true)
  })
}))

// Mock createCommitApi
jest.mock('@/utils/createCommitApi', () => ({
  createCommitApi: () => ({
    removeFile: jest.fn(),
    replaceFile: jest.fn(),
    createInput: jest.fn()
  })
}))

test('DeleteMediaButton renders and operates correctly', async () => {
  const onComplete = jest.fn()

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

  expect(
    screen.getByText('Are you sure you want to delete this media file?')
  ).toBeInTheDocument()

  expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument()

  // Simulate clicking the delete button in the modal
  fireEvent.click(screen.getByText('Delete'))

  // Check if onComplete is called
  await waitFor(() => expect(onComplete).toHaveBeenCalled())

  // Simulate clicking the delete button again
  fireEvent.click(screen.getByTitle('Delete media file'))

  // Simulate clicking the cancel button in the modal
  fireEvent.click(screen.getByText('Cancel'))

  // Check if modal closes
  await waitFor(() =>
    expect(screen.queryByText('Delete Document')).not.toBeInTheDocument()
  )
})
