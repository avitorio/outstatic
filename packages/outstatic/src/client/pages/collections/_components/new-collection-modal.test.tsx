import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import NewCollectionModal from './new-collection-modal'

const mockUseOutstatic = jest.fn()
const mockRefetchCollections = jest.fn()
const mockRefetchDocuments = jest.fn()
const mockFetchOid = jest.fn()
const mockMutateAsync = jest.fn()
const mockRebuildMetadata = jest.fn()
const mockToastError = jest.fn()
const mockToastLoading = jest.fn()
const mockToastMessage = jest.fn()
const mockToastSuccess = jest.fn()
const mockToastWarning = jest.fn()
const mockRouterPush = jest.fn()
const mockRouterRefresh = jest.fn()

jest.mock('@/utils/hooks/use-outstatic', () => ({
  useOutstatic: () => mockUseOutstatic()
}))
jest.mock('@/utils/hooks/use-collections', () => ({
  useCollections: () => ({ refetch: mockRefetchCollections })
}))
jest.mock('@/utils/hooks/use-get-documents', () => ({
  useGetDocuments: () => ({ refetch: mockRefetchDocuments })
}))
jest.mock('@/utils/hooks/use-oid', () => () => mockFetchOid)
jest.mock('@/utils/hooks/use-create-commit', () => ({
  useCreateCommit: () => ({ mutateAsync: mockMutateAsync })
}))
jest.mock('@/utils/hooks/use-rebuild-metadata', () => ({
  useRebuildMetadata: () => mockRebuildMetadata
}))
jest.mock('@/utils/hooks/use-permissions', () => ({
  usePermissions: () => ({ canManageCollections: true })
}))
jest.mock('@/utils/hooks/use-demo-write-guard', () => ({
  useDemoWriteGuard: () => () => false
}))
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    refresh: mockRouterRefresh
  })
}))
jest.mock('change-case', () => ({
  capitalCase: (value: string) => value
}))
jest.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
    loading: (...args: unknown[]) => mockToastLoading(...args),
    message: (...args: unknown[]) => mockToastMessage(...args),
    success: (...args: unknown[]) => mockToastSuccess(...args),
    warning: (...args: unknown[]) => mockToastWarning(...args)
  }
}))
jest.mock('@/components/ui/outstatic/github-explorer', () => ({
  __esModule: true,
  default: () => null
}))
jest.mock('@/components/ui/outstatic/path-breadcrumb', () => ({
  __esModule: true,
  default: () => null
}))

const renderModal = (onOpenChange = jest.fn()) => {
  render(<NewCollectionModal open onOpenChange={onOpenChange} />)

  fireEvent.click(screen.getByRole('button', { name: 'Next Step' }))
  fireEvent.change(screen.getByPlaceholderText('Ex: Posts'), {
    target: { value: 'Posts' }
  })
  fireEvent.click(screen.getByRole('button', { name: 'Create Collection' }))

  return onOpenChange
}

describe('NewCollectionModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseOutstatic.mockReturnValue({
      pages: [],
      hasChanges: true,
      setHasChanges: jest.fn(),
      contentPath: 'outstatic/content',
      monorepoPath: '',
      session: { user: { login: 'test-user' } },
      repoSlug: 'test-repo',
      repoBranch: 'main',
      repoOwner: 'test-user',
      dashboardRoute: '/outstatic'
    })
    mockRefetchCollections.mockResolvedValue({ data: [] })
    mockRefetchDocuments.mockResolvedValue({ data: { documents: [] } })
    mockFetchOid.mockResolvedValue('head-oid')
    mockMutateAsync.mockResolvedValue({})
    mockRebuildMetadata.mockResolvedValue(undefined)
  })

  it('keeps the success result when the collection refresh fails after the commit', async () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {})
    mockRefetchCollections
      .mockResolvedValueOnce({ data: [] })
      .mockRejectedValueOnce(new Error('Refresh failed'))

    const onOpenChange = renderModal()

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith(
        'Collection created successfully',
        expect.objectContaining({ id: 'create-collection' })
      )
    })
    expect(mockToastError).not.toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)

    consoleError.mockRestore()
  })

  it('reports an indexing issue without claiming collection creation failed', async () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {})
    mockRefetchDocuments.mockRejectedValueOnce(new Error('Indexing failed'))

    const onOpenChange = renderModal()

    await waitFor(() => {
      expect(mockToastWarning).toHaveBeenCalledWith(
        'Collection created, but existing content could not be indexed.',
        expect.objectContaining({ id: 'create-collection' })
      )
    })
    expect(mockToastError).not.toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)

    consoleError.mockRestore()
  })
})
