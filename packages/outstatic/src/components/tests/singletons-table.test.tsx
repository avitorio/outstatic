import { TestWrapper } from '@/utils/tests/test-wrapper'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Cookies from 'js-cookie'
import React from 'react'
import { SingletonsTable } from '@/components/singletons-table'

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn()
}

jest.mock('next/navigation', () => ({
  useParams: jest.fn().mockReturnValue({ ost: ['singletons'] }),
  useRouter: jest.fn(() => mockRouter)
}))

jest.mock(
  'next/link',
  () =>
    ({ children }: { children: React.ReactNode }) =>
      children
)

jest.mock('js-cookie', () => ({
  get: jest.fn(() => null),
  set: jest.fn()
}))

jest.mock('change-case', () => {
  return {
    sentenceCase: (str: string) => str
  }
})

const mockSingletons = [
  {
    slug: 'about',
    title: 'About Page',
    status: 'published' as const,
    publishedAt: '2024-01-15T00:00:00.000Z',
    path: 'outstatic/content/_singletons/about.md',
    directory: 'outstatic/content/_singletons'
  },
  {
    slug: 'home',
    title: 'Home Page',
    status: 'draft' as const,
    publishedAt: '2024-02-20T00:00:00.000Z',
    path: 'outstatic/content/_singletons/home.md',
    directory: 'outstatic/content/_singletons'
  }
]

jest.mock('@/utils/hooks/use-singletons', () => ({
  useSingletons: () => ({
    data: mockSingletons,
    refetch: jest.fn()
  })
}))

jest.mock('@/utils/hooks/use-outstatic', () => ({
  useOutstatic: () => ({
    dashboardRoute: '/outstatic'
  }),
  useLocalData: () => ({
    setData: jest.fn()
  })
}))

describe('SingletonsTable', () => {
  beforeEach(() => {
    mockRouter.push.mockClear()
    ;(Cookies.set as jest.Mock).mockClear()
  })

  it('renders a table with provided singletons', () => {
    render(
      <TestWrapper>
        <SingletonsTable />
      </TestWrapper>
    )

    expect(screen.getByText('About Page')).toBeInTheDocument()
    expect(screen.getByText('published')).toBeInTheDocument()

    expect(screen.getByText('Home Page')).toBeInTheDocument()
    expect(screen.getByText('draft')).toBeInTheDocument()
  })

  it('renders table headers correctly', () => {
    render(
      <TestWrapper>
        <SingletonsTable />
      </TestWrapper>
    )

    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
  })

  it('renders sort icons for sortable columns', () => {
    render(
      <TestWrapper>
        <SingletonsTable />
      </TestWrapper>
    )

    expect(screen.getByTestId('sort-icon-publishedAt')).toBeInTheDocument()
    expect(screen.getByTestId('sort-icon-title')).toBeInTheDocument()
  })

  it('toggles sort direction when clicking column header', () => {
    render(
      <TestWrapper>
        <SingletonsTable />
      </TestWrapper>
    )

    const publishedAtHeader = screen.getByText('Published At')

    // Default sort is publishedAt descending
    expect(screen.getByTestId('caret-down-icon')).toBeInTheDocument()

    fireEvent.click(publishedAtHeader)
    expect(screen.getByTestId('caret-up-icon')).toBeInTheDocument()
  })

  it('renders an actions trigger for each singleton', () => {
    render(
      <TestWrapper>
        <SingletonsTable />
      </TestWrapper>
    )

    const actionTriggers = screen.getAllByRole('button', {
      name: /open row actions/i
    })
    expect(actionTriggers.length).toBe(2)
  })

  it('renders the columns dropdown trigger', () => {
    render(
      <TestWrapper>
        <SingletonsTable />
      </TestWrapper>
    )

    const filterButton = screen.getByRole('button', { name: /columns/i })
    expect(filterButton).toBeInTheDocument()
  })

  it('renders a title filter input', () => {
    render(
      <TestWrapper>
        <SingletonsTable />
      </TestWrapper>
    )

    const filterInput = screen.getByPlaceholderText(/filter titles/i)
    expect(filterInput).toBeInTheDocument()
  })

  it('opens singleton editor in a new tab when Cmd/Ctrl/Shift-clicking a row via window.open', () => {
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null)
    render(
      <TestWrapper>
        <SingletonsTable />
      </TestWrapper>
    )

    const row = screen
      .getByText('About Page')
      .closest('tr') as HTMLTableRowElement
    fireEvent.click(row, { metaKey: true })
    fireEvent.click(row, { ctrlKey: true })
    fireEvent.click(row, { shiftKey: true })

    expect(openSpy).toHaveBeenCalledTimes(3)
    expect(openSpy).toHaveBeenCalledWith(
      '/outstatic/singletons/about',
      '_blank',
      'noopener,noreferrer'
    )
    expect(mockRouter.push).not.toHaveBeenCalled()

    openSpy.mockRestore()
  })

  it('opens singleton editor in a new tab when middle-clicking a row', () => {
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null)
    render(
      <TestWrapper>
        <SingletonsTable />
      </TestWrapper>
    )

    const row = screen
      .getByText('Home Page')
      .closest('tr') as HTMLTableRowElement
    row.dispatchEvent(new MouseEvent('auxclick', { bubbles: true, button: 1 }))

    expect(openSpy).toHaveBeenCalledWith(
      '/outstatic/singletons/home',
      '_blank',
      'noopener,noreferrer'
    )
    expect(mockRouter.push).not.toHaveBeenCalled()

    openSpy.mockRestore()
  })

  it('opens the delete confirmation dialog when choosing Delete document from row actions', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper>
        <SingletonsTable />
      </TestWrapper>
    )

    const [firstActions] = screen.getAllByRole('button', {
      name: /open row actions/i
    })
    await user.click(firstActions)

    await user.click(screen.getByRole('menuitem', { name: /delete document/i }))

    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /delete document/i })
    ).toBeInTheDocument()
  })

  it('persists visible columns via js-cookie when toggling the Columns menu', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper>
        <SingletonsTable />
      </TestWrapper>
    )

    await user.click(screen.getByRole('button', { name: /columns/i }))
    await user.click(
      screen.getByRole('menuitemcheckbox', { name: /published at/i })
    )

    expect(Cookies.set).toHaveBeenCalledWith(
      'ost_singletons_fields',
      expect.any(String)
    )
    const json = (Cookies.set as jest.Mock).mock.calls.find(
      (call) => call[0] === 'ost_singletons_fields'
    )?.[1] as string
    const stored = JSON.parse(json) as { id: string; value: string }[]
    expect(stored.map((c) => c.value)).not.toContain('publishedAt')
  })
})
