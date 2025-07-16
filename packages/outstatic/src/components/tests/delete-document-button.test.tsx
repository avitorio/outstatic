import { DeleteDocumentButton } from '@/components/delete-document-button'
import { TestWrapper } from '@/utils/tests/test-wrapper'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

// Mock the useOstSession hook
jest.mock('@/utils/auth/hooks', () => ({
  useOstSession: () => ({
    session: {
      user: {
        username: 'avitorio'
      }
    },
    status: 'authenticated'
  })
}))

jest.mock('change-case', () => {
  return {
    split: (str: string) => str
  }
})

// Mock useOid hook
jest.mock('@/utils/hooks/useOid', () => () => jest.fn().mockReturnValue('123'))
// Mock useGetMetadata hook
jest.mock('@/utils/hooks/useGetMetadata', () => ({
  useGetMetadata: () => ({
    refetch: async () =>
      Promise.resolve({
        data: { metadata: { metadata: [{ slug: 'a-post' }] }, commitUrl: '' }
      })
  })
}))

jest.mock('@/utils/hooks/useCreateCommit', () => ({
  useCreateCommit: () => ({
    mutateAsync: async () => Promise.resolve(true)
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

test('DeleteDocumentButton renders and operates correctly', async () => {
  const onComplete = jest.fn()

  render(
    <TestWrapper>
      <DeleteDocumentButton
        slug={'a-post'}
        extension={'md'}
        disabled={false}
        collection="posts"
        onComplete={onComplete}
      />
    </TestWrapper>
  )

  // Check if button is in the document
  expect(screen.getByTitle('Delete document')).toBeInTheDocument()

  // Simulate clicking the delete button
  fireEvent.click(screen.getByTitle('Delete document'))

  // Check if modal shows up
  expect(screen.getByText('Delete Document')).toBeInTheDocument()

  const dialog = screen.getByRole('alertdialog')
  expect(dialog).toBeInTheDocument()

  // Simulate clicking the delete button in the modal
  fireEvent.click(screen.getByText('Delete'))

  // // Check if onComplete is called
  await waitFor(() => expect(onComplete).toHaveBeenCalled())

  // Simulate clicking the delete button
  fireEvent.click(screen.getByTitle('Delete document'))

  // Simulate clicking the cancel button in the modal
  fireEvent.click(screen.getByText('Cancel'))

  // Check if modal closes
  await waitFor(() =>
    expect(screen.queryByText('Delete Document')).not.toBeInTheDocument()
  )
})
