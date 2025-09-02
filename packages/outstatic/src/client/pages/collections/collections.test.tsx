import { render, screen, fireEvent } from '@testing-library/react'
import Collections from './collections'
import { useCollections } from '@/utils/hooks/useCollections'
import { useOutstatic, useLocalData } from '@/utils/hooks/useOutstatic'
import { TestWrapper } from '@/utils/tests/test-wrapper'
import { useInitialData } from '@/utils/hooks/useInitialData'

// Mock the hooks
jest.mock('@/utils/hooks/useCollections')
jest.mock('@/utils/hooks/useOutstatic')
jest.mock('@/utils/hooks/useInitialData')
jest.mock('@/utils/auth/hooks', () => ({
  useOstSession: () => ({ status: 'authenticated' })
}))

// Mock useRouter:
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn()
  })),
  usePathname: jest.fn(() => '/collections'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  useParams: jest.fn(() => ({}))
}))

// Mock change-case:
jest.mock('change-case', () => {
  return {
    split: (str: string) => str
  }
})

describe('Collections', () => {
  const mockCollections = [
    { slug: 'blog', title: 'Blog' },
    { slug: 'projects', title: 'Projects' }
  ]

  beforeEach(() => {
    // Mock useOutstatic hook
    ;(useOutstatic as jest.Mock).mockReturnValue({
      dashboardRoute: '/outstatic'
    })

    // Mock useOutstatic hook
    ;(useLocalData as jest.Mock).mockReturnValue({
      setData: jest.fn()
    })
  })

  it('shows loading state when fetching collections', () => {
    ;(useCollections as jest.Mock).mockReturnValue({
      isPending: true,
      data: null
    })

    render(
      <TestWrapper>
        <Collections />
      </TestWrapper>
    )

    expect(screen.getByTestId('admin-loading')).toBeInTheDocument()
  })

  it('shows onboarding when no collections exist and no repo branch', async () => {
    // Mock useInitialData hook
    ;(useInitialData as jest.Mock).mockReturnValue(() => ({
      repoBranch: null
    }))
    ;(useCollections as jest.Mock).mockReturnValue({
      isPending: false,
      data: []
    })

    render(
      <TestWrapper>
        <Collections />
      </TestWrapper>
    )

    // Update to match the exact text in the component
    expect(await screen.findByText('Confirm your Branch')).toBeInTheDocument()
  })

  it('renders collections list correctly', () => {
    ;(useCollections as jest.Mock).mockReturnValue({
      isPending: false,
      data: mockCollections
    })

    render(
      <TestWrapper>
        <Collections />
      </TestWrapper>
    )

    expect(screen.getByText('Collections')).toBeInTheDocument()
    expect(screen.getByText('Blog')).toBeInTheDocument()
    expect(screen.getByText('Projects')).toBeInTheDocument()
    expect(screen.getByText('New Collection')).toBeInTheDocument()
  })

  it('opens delete modal when delete button is clicked', () => {
    ;(useCollections as jest.Mock).mockReturnValue({
      isPending: false,
      data: mockCollections
    })

    render(
      <TestWrapper>
        <Collections />
      </TestWrapper>
    )

    const deleteButtons = screen.getAllByRole('button', {
      name: /delete content/i
    })
    fireEvent.click(deleteButtons[0])

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(
      screen.getByText(/are you sure you want to delete/i)
    ).toBeInTheDocument()
  })

  it('has correct navigation links', () => {
    ;(useCollections as jest.Mock).mockReturnValue({
      isPending: false,
      data: mockCollections
    })

    render(
      <TestWrapper>
        <Collections />
      </TestWrapper>
    )

    // Check New Collection link
    expect(
      screen.getByRole('button', { name: 'New Collection' })
    ).toBeInTheDocument()

    // Check collection links
    expect(screen.getByRole('link', { name: 'Blog' })).toHaveAttribute(
      'href',
      '/outstatic/blog'
    )

    // Check settings links
    const settingsLinks = screen.getAllByRole('link', {
      name: 'Edit collection'
    })
    expect(settingsLinks[0]).toHaveAttribute(
      'href',
      '/outstatic/collections/blog'
    )
  })
})
