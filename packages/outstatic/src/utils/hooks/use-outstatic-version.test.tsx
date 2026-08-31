import { OUTSTATIC_API_PATH, OUTSTATIC_VERSION } from '@/utils/constants'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { PropsWithChildren } from 'react'
import { queryPersistOptions } from '@/utils/react-query/query-client'
import { useOutstaticVersion } from './use-outstatic-version'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })

  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe('useOutstaticVersion', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  it('checks the bundled version against the hosted endpoint', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        currentVersion: OUTSTATIC_VERSION,
        latestVersion: '9.0.0',
        updateAvailable: true
      })
    })

    const { result } = renderHook(() => useOutstaticVersion(), {
      wrapper: createWrapper()
    })

    await waitFor(() => expect(result.current.data).toBeDefined())

    const expectedUrl = `${OUTSTATIC_API_PATH}/version?version=${OUTSTATIC_VERSION}`
    expect(global.fetch).toHaveBeenCalledWith(expectedUrl, {
      headers: { Accept: 'application/json' }
    })
    expect(result.current.data).toEqual({
      currentVersion: OUTSTATIC_VERSION,
      latestVersion: '9.0.0',
      updateAvailable: true
    })
  })

  it('fails silently when the endpoint is unavailable', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('offline'))

    const { result } = renderHook(() => useOutstaticVersion(), {
      wrapper: createWrapper()
    })

    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 2000
    })
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('does not fetch when disabled', () => {
    renderHook(() => useOutstaticVersion({ enabled: false }), {
      wrapper: createWrapper()
    })

    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('keeps successful checks fresh and persisted for 24 hours', () => {
    const queryClient = new QueryClient()

    function Wrapper({ children }: PropsWithChildren) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      )
    }

    renderHook(() => useOutstaticVersion({ enabled: false }), {
      wrapper: Wrapper
    })

    const query = queryClient.getQueryCache().find({
      queryKey: ['outstatic-version', OUTSTATIC_VERSION, '']
    })
    const options = query?.options as
      | {
          gcTime?: number
          refetchOnReconnect?: boolean
          staleTime?: number
        }
      | undefined

    expect(options?.staleTime).toBe(1000 * 60 * 60 * 24)
    expect(options?.gcTime).toBe(1000 * 60 * 60 * 24)
    expect(options?.refetchOnReconnect).toBe(false)
    expect(query?.meta).toEqual({
      persist: true,
      suppressErrorToast: true
    })

    const shouldDehydrateQuery =
      queryPersistOptions.dehydrateOptions.shouldDehydrateQuery

    expect(query).toBeDefined()
    expect(shouldDehydrateQuery(query!)).toBe(false)

    queryClient.setQueryData(['outstatic-version', OUTSTATIC_VERSION, ''], {
      currentVersion: OUTSTATIC_VERSION,
      latestVersion: OUTSTATIC_VERSION,
      updateAvailable: false
    })

    const successfulQuery = queryClient.getQueryCache().find({
      queryKey: ['outstatic-version', OUTSTATIC_VERSION, '']
    })

    expect(successfulQuery).toBeDefined()
    expect(shouldDehydrateQuery(successfulQuery!)).toBe(true)
  })

  it('uses the configured base path for the same-origin request', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        currentVersion: OUTSTATIC_VERSION,
        latestVersion: OUTSTATIC_VERSION,
        updateAvailable: false
      })
    })

    renderHook(() => useOutstaticVersion({ basePath: '/cms/' }), {
      wrapper: createWrapper()
    })

    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    expect(global.fetch).toHaveBeenCalledWith(
      `/cms${OUTSTATIC_API_PATH}/version?version=${OUTSTATIC_VERSION}`,
      { headers: { Accept: 'application/json' } }
    )
  })
})
