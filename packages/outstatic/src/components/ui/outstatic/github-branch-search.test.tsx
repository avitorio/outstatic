import { act, render, waitFor } from '@testing-library/react'
import { GitHubBranchSearch } from './github-branch-search'
import { useInitialData } from '@/utils/hooks/use-initial-data'
import { useLocalData, useOutstatic } from '@/utils/hooks/use-outstatic'
import { useQueryClient } from '@tanstack/react-query'

type SearchComboboxRecord = {
  value: string
  label: string
}

type SearchComboboxProps = {
  data: SearchComboboxRecord[]
  value: string
  setValue: (value: string) => void
  onValueChange?: (value: string) => void
  onOpenChange?: (open: boolean) => void
  isOpen?: boolean
}

const searchComboboxMock = jest.fn()

jest.mock('@/components/ui/outstatic/search-combobox', () => ({
  SearchCombobox: (props: SearchComboboxProps) => {
    searchComboboxMock(props)
    return <div data-testid="search-combobox" />
  }
}))

jest.mock('@/components/ui/outstatic/create-branch-dialog', () => ({
  CreateBranchDialog: () => null
}))

jest.mock('@/utils/hooks/use-initial-data', () => ({
  useInitialData: jest.fn()
}))

jest.mock('@/utils/hooks/use-outstatic', () => ({
  useOutstatic: jest.fn(),
  useLocalData: jest.fn()
}))

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: jest.fn()
}))

const mockUseInitialData = useInitialData as jest.Mock
const mockUseOutstatic = useOutstatic as jest.Mock
const mockUseLocalData = useLocalData as jest.Mock
const mockUseQueryClient = useQueryClient as jest.Mock

const getLatestSearchComboboxProps = (): SearchComboboxProps => {
  const lastCall = searchComboboxMock.mock.calls[searchComboboxMock.mock.calls.length - 1]
  expect(lastCall).toBeDefined()
  return lastCall[0] as SearchComboboxProps
}

describe('GitHubBranchSearch', () => {
  const requestMock = jest.fn()

  beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllMocks()

    requestMock.mockResolvedValue({
      repository: {
        refs: {
          nodes: [{ name: 'main' }, { name: 'develop' }]
        }
      }
    })

    mockUseInitialData.mockReturnValue({ repoBranch: null })
    mockUseLocalData.mockReturnValue({ setData: jest.fn() })
    mockUseQueryClient.mockReturnValue({ invalidateQueries: jest.fn() })

    // Return a new gqlClient object every render to simulate unstable identity.
    mockUseOutstatic.mockImplementation(() => ({
      repoOwner: 'owner',
      repoSlug: 'repo',
      repoBranch: 'main',
      gqlClient: { request: requestMock },
      session: { user: { permissions: [] } }
    }))
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('does not loop requests when combobox is opened', async () => {
    render(<GitHubBranchSearch onboarding />)

    await waitFor(() => {
      expect(searchComboboxMock).toHaveBeenCalled()
    })

    act(() => {
      getLatestSearchComboboxProps().onOpenChange?.(true)
    })

    act(() => {
      jest.advanceTimersByTime(300)
    })

    await waitFor(() => {
      expect(requestMock).toHaveBeenCalledTimes(1)
    })

    act(() => {
      jest.advanceTimersByTime(1500)
    })

    await waitFor(() => {
      expect(requestMock).toHaveBeenCalledTimes(1)
    })
  })

  it('searches with the typed query when open', async () => {
    render(<GitHubBranchSearch />)

    await waitFor(() => {
      expect(searchComboboxMock).toHaveBeenCalled()
    })

    act(() => {
      const props = getLatestSearchComboboxProps()
      props.onOpenChange?.(true)
      props.onValueChange?.('feat')
    })

    act(() => {
      jest.advanceTimersByTime(300)
    })

    await waitFor(() => {
      expect(requestMock).toHaveBeenLastCalledWith(expect.anything(), {
        owner: 'owner',
        name: 'repo',
        first: 10,
        query: 'feat'
      })
    })
  })
})
