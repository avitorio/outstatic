import { TestWrapper } from '@/utils/tests/test-wrapper'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { SingletonsTable } from '@/components/singletons-table'

jest.mock('next/navigation', () => ({
  useParams: jest.fn().mockReturnValue({ ost: ['singletons'] }),
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn()
  })
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

jest.mock('@/utils/hooks/useSingletons', () => ({
  useSingletons: () => ({
    data: mockSingletons,
    refetch: jest.fn()
  })
}))

jest.mock('@/utils/hooks/useOutstatic', () => ({
  useOutstatic: () => ({
    dashboardRoute: '/outstatic'
  }),
  useLocalData: () => ({
    setData: jest.fn()
  })
}))

describe('SingletonsTable', () => {
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

    // Default sort is by title ascending
    expect(screen.getByTestId('sort-icon-title')).toBeInTheDocument()
  })

  it('toggles sort direction when clicking column header', () => {
    render(
      <TestWrapper>
        <SingletonsTable />
      </TestWrapper>
    )

    const titleHeader = screen.getByText('Title')

    // Initially ascending
    expect(screen.getByTestId('caret-up-icon')).toBeInTheDocument()

    // Click to toggle to descending
    fireEvent.click(titleHeader)
    expect(screen.getByTestId('caret-down-icon')).toBeInTheDocument()
  })

  it('renders action buttons for each singleton', () => {
    render(
      <TestWrapper>
        <SingletonsTable />
      </TestWrapper>
    )

    // Settings icons should be present (sr-only text)
    const settingsLabels = screen.getAllByText(/edit singleton fields/i)
    expect(settingsLabels.length).toBe(2)

    // Delete buttons should be present
    const deleteButtons = screen.getAllByRole('button', {
      name: /delete document/i
    })
    expect(deleteButtons.length).toBe(2)
  })

  it('renders column filter button', () => {
    render(
      <TestWrapper>
        <SingletonsTable />
      </TestWrapper>
    )

    const filterButton = screen.getByRole('button', { name: /list columns/i })
    expect(filterButton).toBeInTheDocument()
  })
})
