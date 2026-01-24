import { render, screen } from '@testing-library/react'
import Singletons from './singletons'
import { useOutstatic } from '@/utils/hooks/useOutstatic'
import { useGetMetadata } from '@/utils/hooks/useGetMetadata'
import { TestWrapper } from '@/utils/tests/test-wrapper'

// Mock the hooks
jest.mock('@/utils/hooks/useOutstatic')
jest.mock('@/utils/hooks/useGetMetadata')
jest.mock('@/utils/auth/hooks', () => ({
  useOstSession: () => ({ status: 'authenticated' })
}))
jest.mock('@/utils/hooks/useSingletons', () => ({
  useSingletons: () => ({
    data: [],
    refetch: jest.fn()
  })
}))

// Mock useRouter
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn()
  })),
  usePathname: jest.fn(() => '/singletons'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  useParams: jest.fn(() => ({}))
}))

// Mock change-case
jest.mock('change-case', () => {
  return {
    split: (str: string) => str
  }
})

describe('Singletons', () => {
  const mockSingletons = [
    {
      slug: 'about',
      title: 'About',
      collection: '_singletons',
      status: 'published',
      publishedAt: '2024-01-01'
    },
    {
      slug: 'home',
      title: 'Home',
      collection: '_singletons',
      status: 'draft',
      publishedAt: '2024-01-02'
    }
  ]

  beforeEach(() => {
    ;(useOutstatic as jest.Mock).mockReturnValue({
      dashboardRoute: '/outstatic',
      basePath: ''
    })
  })

  it('shows loading state when fetching singletons', () => {
    ;(useGetMetadata as jest.Mock).mockReturnValue({
      isPending: true,
      data: null
    })

    render(
      <TestWrapper>
        <Singletons />
      </TestWrapper>
    )

    expect(screen.getByTestId('admin-loading')).toBeInTheDocument()
  })

  it('shows onboarding when no singletons exist', async () => {
    ;(useGetMetadata as jest.Mock).mockReturnValue({
      isPending: false,
      data: {
        metadata: {
          metadata: []
        }
      }
    })

    render(
      <TestWrapper>
        <Singletons />
      </TestWrapper>
    )

    expect(
      await screen.findByText('Create a Singleton')
    ).toBeInTheDocument()
  })

  it('renders singletons list correctly', async () => {
    ;(useGetMetadata as jest.Mock).mockReturnValue({
      isPending: false,
      data: {
        metadata: {
          metadata: mockSingletons
        }
      }
    })

    render(
      <TestWrapper>
        <Singletons />
      </TestWrapper>
    )

    expect(screen.getByText('Singletons')).toBeInTheDocument()
    expect(screen.getByText('New Singleton')).toBeInTheDocument()
  })

  it('has correct navigation links', () => {
    ;(useGetMetadata as jest.Mock).mockReturnValue({
      isPending: false,
      data: {
        metadata: {
          metadata: mockSingletons
        }
      }
    })

    render(
      <TestWrapper>
        <Singletons />
      </TestWrapper>
    )

    // Check New Singleton link
    expect(
      screen.getByRole('link', { name: 'New Singleton' })
    ).toHaveAttribute('href', '/outstatic/singletons/new')
  })

  it('renders open from file button when singletons exist', () => {
    ;(useGetMetadata as jest.Mock).mockReturnValue({
      isPending: false,
      data: {
        metadata: {
          metadata: mockSingletons
        }
      }
    })

    render(
      <TestWrapper>
        <Singletons />
      </TestWrapper>
    )

    const openFileButton = screen.getByRole('button', { name: /open from file/i })
    expect(openFileButton).toBeInTheDocument()
  })
})
