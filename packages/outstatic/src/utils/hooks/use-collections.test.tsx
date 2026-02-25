import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { useOutstatic } from '@/utils/hooks/use-outstatic'
import useOid from './use-oid'
import { useCreateCommit } from './use-create-commit'
import { createCommitApi } from '../create-commit-api'
import { toast } from 'sonner'
import { useCollections } from './use-collections'

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

jest.mock('../create-commit-api', () => ({
  createCommitApi: jest.fn()
}))

jest.mock('sonner', () => ({
  toast: {
    promise: jest.fn(),
    error: jest.fn(),
    message: jest.fn()
  }
}))

jest.mock('change-case', () => ({
  sentenceCase: (value: string) =>
    value.length > 0 ? value.charAt(0).toUpperCase() + value.slice(1) : value
}))

const mockUseOutstatic = useOutstatic as jest.Mock
const mockUseOid = useOid as jest.Mock
const mockUseCreateCommit = useCreateCommit as jest.Mock
const mockCreateCommitApi = createCommitApi as jest.Mock
const mockToastPromise = toast.promise as jest.Mock

const requestMock = jest.fn()
const fetchOidMock = jest.fn()
const mutateAsyncMock = jest.fn()
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

describe('useCollections', () => {
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
    mockCreateCommitApi.mockReturnValue({
      replaceFile: replaceFileMock,
      createInput: createInputMock
    })
    mockToastPromise.mockImplementation((promise: Promise<unknown>) => promise)
  })

  it('filters _singletons when collections.json exists', async () => {
    requestMock.mockResolvedValue({
      repository: {
        object: {
          text: JSON.stringify([
            {
              title: '_ singletons',
              slug: '_singletons',
              path: 'outstatic/content/_singletons',
              children: []
            },
            {
              title: 'Posts',
              slug: 'posts',
              path: 'outstatic/content/posts',
              children: []
            }
          ])
        }
      }
    })

    const { result } = renderHook(() => useCollections(), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual([
      {
        title: 'Posts',
        slug: 'posts',
        path: 'outstatic/content/posts',
        children: []
      }
    ])
    expect(mutateAsyncMock).not.toHaveBeenCalled()
  })

  it('does not write _singletons when bootstrapping collections.json', async () => {
    requestMock
      .mockResolvedValueOnce({
        repository: {
          object: null
        }
      })
      .mockResolvedValueOnce({
        repository: {
          object: {
            entries: [
              { name: '_singletons', type: 'tree' },
              { name: 'posts', type: 'tree' },
              { name: 'README.md', type: 'blob' }
            ]
          }
        }
      })

    fetchOidMock.mockResolvedValue('oid-123')
    createInputMock.mockReturnValue({ payload: 'commit-input' })
    mutateAsyncMock.mockResolvedValue({})

    const { result } = renderHook(() => useCollections(), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    const expectedCollections = [
      {
        title: 'Posts',
        slug: 'posts',
        path: 'outstatic/content/posts',
        children: []
      }
    ]

    expect(result.current.data).toEqual(expectedCollections)
    expect(mockCreateCommitApi).toHaveBeenCalledWith({
      message: 'chore: Updates collections',
      owner: 'acme',
      name: 'site',
      branch: 'main',
      oid: 'oid-123'
    })
    expect(replaceFileMock).toHaveBeenCalledWith(
      'outstatic/content/collections.json',
      JSON.stringify(expectedCollections, null, 2)
    )
    expect(mutateAsyncMock).toHaveBeenCalledWith({ payload: 'commit-input' })
  })
})
