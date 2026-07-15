import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { usePermissions } from './use-permissions'
import { useContentScan } from './use-content-scan'
import { useOutstatic } from './use-outstatic'
import { ensureWebApiGlobals } from '../../app/api/auth/test-helpers'

jest.mock('./use-outstatic', () => ({ useOutstatic: jest.fn() }))
jest.mock('./use-permissions', () => ({ usePermissions: jest.fn() }))

const mockUseOutstatic = useOutstatic as jest.Mock
const mockUsePermissions = usePermissions as jest.Mock

describe('useContentScan', () => {
  beforeEach(() => {
    ensureWebApiGlobals()
    jest.clearAllMocks()
    global.fetch = jest.fn()
    mockUseOutstatic.mockReturnValue({
      contentScanUrl: '/api/outstatic/scan',
      projectInfo: { projectId: 'project-1' },
      repoBranch: 'main'
    })
    mockUsePermissions.mockReturnValue({ canManageCollections: true })
  })

  it('surfaces plain-text proxy errors', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue(
      new Response('Repository discovery is not configured.', { status: 404 })
    )
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    })
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    const { result } = renderHook(() => useContentScan(), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error?.message).toBe(
      'Repository discovery is not configured.'
    )
  })
})
