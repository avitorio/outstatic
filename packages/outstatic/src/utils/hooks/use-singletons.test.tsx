import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { useOutstatic } from '@/utils/hooks/use-outstatic'
import useOid from './use-oid'
import { useCreateCommit } from './use-create-commit'
import { useGetDocuments } from './use-get-documents'
import { createCommitApi } from '../create-commit-api'
import { toast } from 'sonner'
import { useSingletons } from './use-singletons'

jest.mock('@/utils/hooks/use-outstatic', () => ({
  useOutstatic: jest.fn()
}))

jest.mock('./use-oid', () => ({
  __esModule: true,
  default: jest.fn()
}))

jest.mock('./use-create-commit', () => ({
  useCreateCommit: jest.fn()
}))

jest.mock('./use-get-documents', () => ({
  useGetDocuments: jest.fn()
}))

jest.mock('../create-commit-api', () => ({
  createCommitApi: jest.fn()
}))

jest.mock('sonner', () => ({
  toast: {
    promise: jest.fn(),
    error: jest.fn()
  }
}))

const mockUseOutstatic = useOutstatic as jest.Mock
const mockUseOid = useOid as jest.Mock
const mockUseCreateCommit = useCreateCommit as jest.Mock
const mockUseGetDocuments = useGetDocuments as jest.Mock
const mockCreateCommitApi = createCommitApi as jest.Mock
const mockToastPromise = toast.promise as jest.Mock

const requestMock = jest.fn()
const fetchOidMock = jest.fn()
const mutateAsyncMock = jest.fn()
const refetchDocumentsMock = jest.fn()
const replaceFileMock = jest.fn()
const createInputMock = jest.fn()

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  })

const createWrapper = () => {
  const queryClient = createQueryClient()
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  Wrapper.displayName = 'QueryClientWrapper'
  return Wrapper
}

describe('useSingletons', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockUseOutstatic.mockReturnValue({
      repoOwner: 'acme',
      repoSlug: 'site',
      repoBranch: 'main',
      isPending: false,
      gqlClient: {
        request: requestMock
      },
      ostContent: 'outstatic/content'
    })

    mockUseOid.mockReturnValue(fetchOidMock)
    mockUseCreateCommit.mockReturnValue({
      mutateAsync: mutateAsyncMock
    })
    mockUseGetDocuments.mockReturnValue({
      refetch: refetchDocumentsMock
    })
    mockCreateCommitApi.mockReturnValue({
      replaceFile: replaceFileMock,
      createInput: createInputMock
    })
    mockToastPromise.mockImplementation((promise: Promise<unknown>) => promise)
  })

  it('returns [] and skips commit when _singletons folder is missing', async () => {
    requestMock.mockResolvedValue({
      repository: {
        object: null
      }
    })

    refetchDocumentsMock.mockResolvedValue({
      data: {
        documents: null
      }
    })

    const { result } = renderHook(() => useSingletons(), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual([])
    expect(refetchDocumentsMock).toHaveBeenCalledTimes(1)
    expect(fetchOidMock).not.toHaveBeenCalled()
    expect(mockCreateCommitApi).not.toHaveBeenCalled()
    expect(mutateAsyncMock).not.toHaveBeenCalled()
    expect(mockToastPromise).not.toHaveBeenCalled()
  })

  it('bootstraps singletons.json and commits when _singletons exists', async () => {
    requestMock.mockResolvedValue({
      repository: {
        object: null
      }
    })

    refetchDocumentsMock.mockResolvedValue({
      data: {
        documents: [
          {
            title: 'About',
            slug: 'about',
            extension: 'mdx',
            publishedAt: '2026-01-01',
            status: 'published'
          },
          {
            title: 'Contact',
            slug: 'contact',
            extension: 'md',
            publishedAt: '2026-01-02',
            status: 'draft'
          }
        ]
      }
    })

    fetchOidMock.mockResolvedValue('oid-123')
    createInputMock.mockReturnValue({ payload: 'commit-input' })
    mutateAsyncMock.mockResolvedValue({})

    const { result } = renderHook(() => useSingletons(), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    const expectedSingletons = [
      {
        title: 'About',
        slug: 'about',
        path: 'outstatic/content/_singletons/about.mdx',
        directory: 'outstatic/content/_singletons',
        publishedAt: '2026-01-01',
        status: 'published'
      },
      {
        title: 'Contact',
        slug: 'contact',
        path: 'outstatic/content/_singletons/contact.md',
        directory: 'outstatic/content/_singletons',
        publishedAt: '2026-01-02',
        status: 'draft'
      }
    ]

    expect(result.current.data).toEqual(expectedSingletons)
    expect(refetchDocumentsMock).toHaveBeenCalledTimes(1)
    expect(fetchOidMock).toHaveBeenCalledTimes(1)
    expect(mockCreateCommitApi).toHaveBeenCalledWith({
      message: 'chore: Updates singletons',
      owner: 'acme',
      name: 'site',
      branch: 'main',
      oid: 'oid-123'
    })
    expect(replaceFileMock).toHaveBeenCalledWith(
      'outstatic/content/singletons.json',
      JSON.stringify(expectedSingletons, null, 2)
    )
    expect(createInputMock).toHaveBeenCalledTimes(1)
    expect(mutateAsyncMock).toHaveBeenCalledWith({ payload: 'commit-input' })
    expect(mockToastPromise).toHaveBeenCalledTimes(1)
  })
})
