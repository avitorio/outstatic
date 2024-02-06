import DeleteDocumentButton from '@/components/DeleteDocumentButton'
import { TestWrapper } from '@/utils/TestWrapper'
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

// Mock useOid hook
jest.mock('@/utils/hooks/useOid', () => () => jest.fn())

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

  expect(
    screen.getByText('Are you sure you want to delete this document?')
  ).toBeInTheDocument()

  expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument()

  // Simulate clicking the delete button in the modal
  fireEvent.click(screen.getByText('Delete'))

  // Check if onComplete is called
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
