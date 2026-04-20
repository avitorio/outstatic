import { render, screen } from '@testing-library/react'
import Dashboard from './dashboard'
import { useCollections } from '@/utils/hooks/use-collections'
import { useSingletons } from '@/utils/hooks/use-singletons'
import { useOutstatic } from '@/utils/hooks/use-outstatic'
import { TestWrapper } from '@/utils/tests/test-wrapper'

jest.mock('@/utils/hooks/use-collections')
jest.mock('@/utils/hooks/use-singletons')
jest.mock('@/utils/hooks/use-outstatic')
jest.mock('@/utils/auth/hooks', () => ({
  useOstSession: () => ({ status: 'authenticated' })
}))
jest.mock('../_components/open-file-modal', () => ({
  __esModule: true,
  default: function MockOpenFileModal() {
    return null
  }
}))
jest.mock('../collections/_components/new-collection-modal', () => ({
  __esModule: true,
  default: function MockNewCollectionModal() {
    return null
  }
}))
jest.mock('../singletons/_components/singleton-onboarding', () => ({
  __esModule: true,
  default: function MockSingletonOnboarding() {
    return <div>Singleton onboarding</div>
  }
}))

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn()
  })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  useParams: jest.fn(() => ({}))
}))

jest.mock('change-case', () => ({
  split: (str: string) => str
}))

describe('Dashboard', () => {
  beforeEach(() => {
    ;(useCollections as jest.Mock).mockReturnValue({
      data: [{ slug: 'blog', title: 'Blog' }],
      isPending: false
    })
    ;(useSingletons as jest.Mock).mockReturnValue({
      data: [],
      isPending: false
    })
    ;(useOutstatic as jest.Mock).mockReturnValue({
      dashboardRoute: '/outstatic',
      basePath: '',
      session: {
        user: {
          permissions: ['collections.manage', 'content.manage']
        }
      }
    })
  })

  it('shows collection management actions for users with collections.manage', () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    )

    expect(
      screen.getByRole('button', { name: 'New Collection' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Edit Collections' })
    ).toHaveAttribute('href', '/outstatic/collections')
  })

  it('hides collection management actions for users without collections.manage', () => {
    ;(useOutstatic as jest.Mock).mockReturnValue({
      dashboardRoute: '/outstatic',
      basePath: '',
      session: {
        user: {
          permissions: ['content.manage']
        }
      }
    })

    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    )

    expect(
      screen.queryByRole('button', { name: 'New Collection' })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'Edit Collections' })
    ).not.toBeInTheDocument()
  })
})
