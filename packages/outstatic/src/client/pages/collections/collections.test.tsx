import { render, screen, fireEvent } from '@testing-library/react'
import { StrictMode } from 'react'
import Collections from './collections'
import { useCollections } from '@/utils/hooks/use-collections'
import { useOutstatic, useLocalData } from '@/utils/hooks/use-outstatic'
import { TestWrapper } from '@/utils/tests/test-wrapper'

// Mock the hooks
jest.mock('@/utils/hooks/use-collections')
jest.mock('@/utils/hooks/use-outstatic')
jest.mock('@/utils/hooks/use-initial-data')
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

const hasMaximumUpdateDepthError = (calls: unknown[][]) =>
  calls.some((call) =>
    call.some((arg) => {
      if (typeof arg === 'string') {
        return arg.includes('Maximum update depth exceeded')
      }

      if (arg instanceof Error) {
        return arg.message.includes('Maximum update depth exceeded')
      }

      if (
        arg &&
        typeof arg === 'object' &&
        'message' in arg &&
        typeof (arg as { message: unknown }).message === 'string'
      ) {
        return (arg as { message: string }).message.includes(
          'Maximum update depth exceeded'
        )
      }

      return false
    })
  )

describe('Collections', () => {
  const mockCollections = [
    { slug: 'blog', title: 'Blog' },
    { slug: 'projects', title: 'Projects' }
  ]

  beforeEach(() => {
    // Mock useOutstatic hook with session containing permissions
    ;(useOutstatic as jest.Mock).mockReturnValue({
      dashboardRoute: '/outstatic',
      session: {
        user: {
          name: 'Test User',
          login: 'testuser',
          email: 'test@example.com',
          image: 'https://example.com/avatar.jpg',
          permissions: [
            'collections.manage',
            'content.manage',
            'settings.manage'
          ]
        },
        access_token: 'mock-access-token',
        expires: new Date(Date.now() + 3600000)
      }
    })

    // Mock useLocalData hook
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

  it('shows collection onboarding when no collections exist', async () => {
    ;(useCollections as jest.Mock).mockReturnValue({
      isPending: false,
      data: []
    })

    render(
      <TestWrapper>
        <Collections />
      </TestWrapper>
    )

    // CollectionOnboarding now shows just the collection creation card (no branch confirmation)
    expect(await screen.findByText('Create a Collection')).toBeInTheDocument()
    expect(screen.getByText('Recommended')).toBeInTheDocument()
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

  it('does not trigger maximum update depth errors during render', () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    ;(useCollections as jest.Mock).mockReturnValue({
      isPending: false,
      data: mockCollections
    })

    render(
      <StrictMode>
        <TestWrapper>
          <Collections />
        </TestWrapper>
      </StrictMode>
    )

    expect(screen.getByText('Collections')).toBeInTheDocument()
    expect(hasMaximumUpdateDepthError(consoleErrorSpy.mock.calls)).toBe(false)

    consoleErrorSpy.mockRestore()
  })
})
