import { DeleteDocumentButton } from '@/components/delete-document-button'
import { TestWrapper } from '@/utils/tests/test-wrapper'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'

const mutateAsyncMock = jest.fn()
const mockBlockDemoWrite = jest.fn(() => false)

jest.mock('@/utils/hooks/use-demo-write-guard', () => ({
  useDemoWriteGuard: () => mockBlockDemoWrite
}))

jest.mock('@/components/ui/outstatic/upgrade-dialog-context', () => ({
  useUpgradeDialog: () => ({ openUpgradeDialog: jest.fn() })
}))

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
jest.mock('@/utils/hooks/use-oid', () => () => jest.fn().mockReturnValue('123'))
// Mock useGetMetadata hook
jest.mock('@/utils/hooks/use-get-metadata', () => ({
  useGetMetadata: () => ({
    refetch: async () =>
      Promise.resolve({
        data: { metadata: { metadata: [{ slug: 'a-post' }] }, commitUrl: '' }
      })
  })
}))

jest.mock('@/utils/hooks/use-create-commit', () => ({
  useCreateCommit: () => ({
    mutateAsync: mutateAsyncMock
  })
}))

jest.mock('@/utils/hooks/use-collections', () => ({
  useCollections: () => ({
    refetch: async () =>
      Promise.resolve({
        data: [{ slug: 'posts', path: 'outstatic/content/posts' }]
      })
  })
}))

jest.mock('@/utils/hooks/use-singletons', () => ({
  useSingletons: () => ({
    refetch: async () =>
      Promise.resolve({
        data: []
      })
  })
}))

// Mock createCommitApi
jest.mock('@/utils/create-commit-api', () => ({
  createCommitApi: () => ({
    removeFile: jest.fn(),
    replaceFile: jest.fn(),
    createInput: jest.fn()
  })
}))

test('DeleteDocumentButton renders and operates correctly', async () => {
  mockBlockDemoWrite.mockImplementation(() => false)
  const onComplete = jest.fn()
  let resolveMutation!: (value: boolean) => void

  mutateAsyncMock.mockImplementation(
    () =>
      new Promise<boolean>((resolve) => {
        resolveMutation = resolve
      })
  )

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

  expect(onComplete).not.toHaveBeenCalled()
  await waitFor(() => expect(mutateAsyncMock).toHaveBeenCalled())

  await act(async () => {
    resolveMutation(true)
  })

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

test('DeleteDocumentButton closes its confirmation when demo writes are blocked', async () => {
  mutateAsyncMock.mockClear()
  mockBlockDemoWrite.mockImplementation((onBlocked?: () => void) => {
    onBlocked?.()
    return true
  })

  render(
    <TestWrapper>
      <DeleteDocumentButton slug="a-post" extension="md" collection="posts" />
    </TestWrapper>
  )

  fireEvent.click(screen.getByTitle('Delete document'))
  fireEvent.click(screen.getByText('Delete'))

  await waitFor(() =>
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  )
  expect(mutateAsyncMock).not.toHaveBeenCalled()
})
