import { act, render, waitFor } from '@testing-library/react'
import { GitHubRepoSearch } from './github-repo-search'
import { useInitialData } from '@/utils/hooks/use-initial-data'
import { useLocalData, useOutstatic } from '@/utils/hooks/use-outstatic'

type SearchComboboxRecord = {
  value: string
  label: string
}

type SearchComboboxProps = {
  data: SearchComboboxRecord[]
  value: string
  setValue: (value: string) => void
  onValueChange?: (value: string) => void
  isLoading?: boolean
}

const searchComboboxMock = jest.fn()

jest.mock('@/components/ui/outstatic/search-combobox', () => ({
  SearchCombobox: (props: SearchComboboxProps) => {
    searchComboboxMock(props)
    return <div data-testid="search-combobox" />
  }
}))

jest.mock('@/utils/hooks/use-initial-data', () => ({
  useInitialData: jest.fn()
}))

jest.mock('@/utils/hooks/use-outstatic', () => ({
  useOutstatic: jest.fn(),
  useLocalData: jest.fn()
}))

const mockUseInitialData = useInitialData as jest.Mock
const mockUseOutstatic = useOutstatic as jest.Mock
const mockUseLocalData = useLocalData as jest.Mock

const getLatestSearchComboboxProps = (): SearchComboboxProps => {
  const lastCall = searchComboboxMock.mock.calls[searchComboboxMock.mock.calls.length - 1]
  expect(lastCall).toBeDefined()
  return lastCall[0] as SearchComboboxProps
}

type Deferred<T> = {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (reason?: unknown) => void
}

const createDeferred = <T,>(): Deferred<T> => {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void

  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  return { promise, resolve, reject }
}

describe('GitHubRepoSearch', () => {
  const mockSetData = jest.fn()
  const fetchMock = jest.fn()

  beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllMocks()

    global.fetch = fetchMock as unknown as typeof fetch

    mockUseInitialData.mockReturnValue({})
    mockUseLocalData.mockReturnValue({ setData: mockSetData })
    mockUseOutstatic.mockReturnValue({
      repoOwner: 'owner-one',
      repoSlug: 'repo-one',
      repoBranch: 'main',
      session: { access_token: 'mock-token' }
    })
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('keeps exact-match suggestions for the active query', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [{ full_name: 'owner-two/repo-two', default_branch: 'main' }]
      })
    })

    render(<GitHubRepoSearch />)

    act(() => {
      getLatestSearchComboboxProps().onValueChange?.('owner-two/repo-two')
    })

    act(() => {
      jest.advanceTimersByTime(300)
    })

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    await waitFor(() => {
      expect(getLatestSearchComboboxProps().data).toEqual([
        { value: 'owner-two/repo-two', label: 'owner-two/repo-two' }
      ])
    })
  })

  it('ignores stale responses and keeps latest query results', async () => {
    const firstRequest = createDeferred<{
      ok: boolean
      json: () => Promise<{ items: { full_name: string; default_branch: string }[] }>
    }>()
    const secondRequest = createDeferred<{
      ok: boolean
      json: () => Promise<{ items: { full_name: string; default_branch: string }[] }>
    }>()

    fetchMock
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(secondRequest.promise)

    render(<GitHubRepoSearch />)

    act(() => {
      getLatestSearchComboboxProps().onValueChange?.('owner-two/repo-two')
    })
    act(() => {
      jest.advanceTimersByTime(300)
    })

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    act(() => {
      getLatestSearchComboboxProps().onValueChange?.('owner-three/repo-three')
    })
    act(() => {
      jest.advanceTimersByTime(300)
    })

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    await act(async () => {
      secondRequest.resolve({
        ok: true,
        json: async () => ({
          items: [
            { full_name: 'owner-three/repo-three', default_branch: 'release' }
          ]
        })
      })
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(getLatestSearchComboboxProps().data).toEqual([
        { value: 'owner-three/repo-three', label: 'owner-three/repo-three' }
      ])
    })

    await act(async () => {
      firstRequest.resolve({
        ok: true,
        json: async () => ({
          items: [{ full_name: 'owner-two/repo-two', default_branch: 'main' }]
        })
      })
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(getLatestSearchComboboxProps().data).toEqual([
        { value: 'owner-three/repo-three', label: 'owner-three/repo-three' }
      ])
    })
  })

  it('keeps current branch when selected repo default branch is missing', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [{ full_name: 'owner-two/repo-two' }]
      })
    })

    render(<GitHubRepoSearch />)

    act(() => {
      getLatestSearchComboboxProps().onValueChange?.('owner-two/repo-two')
    })
    act(() => {
      jest.advanceTimersByTime(300)
    })

    await waitFor(() => {
      expect(getLatestSearchComboboxProps().data).toEqual([
        { value: 'owner-two/repo-two', label: 'owner-two/repo-two' }
      ])
    })

    act(() => {
      getLatestSearchComboboxProps().setValue('owner-two/repo-two')
    })

    expect(mockSetData).toHaveBeenLastCalledWith({
      repoSlug: 'repo-two',
      repoOwner: 'owner-two',
      repoBranch: 'main'
    })
  })

  it('does not rewrite local data when the selected repository is unchanged', () => {
    render(<GitHubRepoSearch />)

    act(() => {
      getLatestSearchComboboxProps().setValue('owner-one/repo-one')
    })

    expect(mockSetData).not.toHaveBeenCalled()
  })
})
