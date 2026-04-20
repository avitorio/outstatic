import { render, screen, fireEvent } from '@testing-library/react'
import CollectionOnboarding from './collection-onboarding'
import { useOutstatic } from '@/utils/hooks/use-outstatic'
import { TestWrapper } from '@/utils/tests/test-wrapper'

jest.mock('@/utils/hooks/use-outstatic')
jest.mock('./new-collection-modal', () => ({
  __esModule: true,
  default: function MockNewCollectionModal() {
    return <div role="dialog">New collection modal</div>
  }
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
  usePathname: jest.fn(() => '/collections'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  useParams: jest.fn(() => ({}))
}))

// Mock change-case
jest.mock('change-case', () => ({
  split: (str: string) => str
}))

describe('CollectionOnboarding', () => {
  beforeEach(() => {
    ;(useOutstatic as jest.Mock).mockReturnValue({
      session: {
        user: {
          permissions: ['collections.manage', 'content.manage']
        }
      }
    })
  })

  it('renders the collection card', () => {
    render(
      <TestWrapper>
        <CollectionOnboarding />
      </TestWrapper>
    )

    expect(screen.getByText('Create a Collection')).toBeInTheDocument()
  })

  it('shows Recommended badge', () => {
    render(
      <TestWrapper>
        <CollectionOnboarding />
      </TestWrapper>
    )

    expect(screen.getByText('Recommended')).toBeInTheDocument()
  })

  it('shows collection description', () => {
    render(
      <TestWrapper>
        <CollectionOnboarding />
      </TestWrapper>
    )

    expect(
      screen.getByText('Used for repeating content with the same structure')
    ).toBeInTheDocument()
  })

  it('shows example use cases', () => {
    render(
      <TestWrapper>
        <CollectionOnboarding />
      </TestWrapper>
    )

    expect(screen.getByText('Blog posts')).toBeInTheDocument()
    expect(screen.getByText('Projects')).toBeInTheDocument()
    expect(screen.getByText('Case studies')).toBeInTheDocument()
    expect(screen.getByText('Team members')).toBeInTheDocument()
  })

  it('shows New Collection button', () => {
    render(
      <TestWrapper>
        <CollectionOnboarding />
      </TestWrapper>
    )

    expect(
      screen.getByRole('button', { name: /New Collection/i })
    ).toBeInTheDocument()
  })

  it('hides the create action when the user cannot manage collections', () => {
    ;(useOutstatic as jest.Mock).mockReturnValue({
      session: {
        user: {
          permissions: ['content.manage']
        }
      }
    })

    render(
      <TestWrapper>
        <CollectionOnboarding />
      </TestWrapper>
    )

    expect(
      screen.queryByRole('button', { name: /New Collection/i })
    ).not.toBeInTheDocument()
    expect(
      screen.getByText(
        'You need permission to manage collections before you can create one.'
      )
    ).toBeInTheDocument()
  })

  it('opens new collection modal when button is clicked', () => {
    render(
      <TestWrapper>
        <CollectionOnboarding />
      </TestWrapper>
    )

    const newCollectionButton = screen.getByRole('button', {
      name: /New Collection/i
    })
    fireEvent.click(newCollectionButton)

    // Modal should open
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('has info tooltip with collection explanation', () => {
    render(
      <TestWrapper>
        <CollectionOnboarding />
      </TestWrapper>
    )

    // The tooltip trigger should have accessible label
    expect(
      screen.getByRole('button', { name: /Learn about collections/i })
    ).toBeInTheDocument()
  })

  it('does not show branch confirmation UI', () => {
    render(
      <TestWrapper>
        <CollectionOnboarding />
      </TestWrapper>
    )

    expect(screen.queryByText('Confirm your Branch')).not.toBeInTheDocument()
    expect(screen.queryByText('Create Branch')).not.toBeInTheDocument()
  })

  it('does not show singleton onboarding', () => {
    render(
      <TestWrapper>
        <CollectionOnboarding />
      </TestWrapper>
    )

    expect(screen.queryByText('Create a Singleton')).not.toBeInTheDocument()
  })
})
