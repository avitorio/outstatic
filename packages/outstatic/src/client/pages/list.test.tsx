import { render, screen } from '@testing-library/react'
import List from './list'
import { useGetDocuments } from '@/utils/hooks/use-get-documents'
import { useOutstatic } from '@/utils/hooks/use-outstatic'
import { TestWrapper } from '@/utils/tests/test-wrapper'

jest.mock('@/utils/hooks/use-get-documents')
jest.mock('@/utils/hooks/use-outstatic')
jest.mock('@/utils/auth/hooks', () => ({
  useOstSession: () => ({ status: 'authenticated' })
}))
jest.mock('@/components/documents-table', () => ({
  DocumentsTable: () => <div>Documents table</div>
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
  usePathname: jest.fn(() => '/blog'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  useParams: jest.fn(() => ({}))
}))

jest.mock('change-case', () => ({
  split: (str: string) => str
}))

describe('List', () => {
  beforeEach(() => {
    ;(useGetDocuments as jest.Mock).mockReturnValue({
      data: { documents: [{ slug: 'post-1' }] },
      isPending: false,
      error: null
    })
    ;(useOutstatic as jest.Mock).mockReturnValue({
      dashboardRoute: '/outstatic',
      session: {
        user: {
          permissions: ['collections.manage', 'content.manage']
        }
      }
    })
  })

  it('shows the collection settings link for users with collections.manage', () => {
    render(
      <TestWrapper>
        <List slug="blog" title="Blog" />
      </TestWrapper>
    )

    expect(
      screen.getByRole('link', { name: 'Edit Collection' })
    ).toHaveAttribute('href', '/outstatic/collections/blog')
  })

  it('hides the collection settings link for users without collections.manage', () => {
    ;(useOutstatic as jest.Mock).mockReturnValue({
      dashboardRoute: '/outstatic',
      session: {
        user: {
          permissions: ['content.manage']
        }
      }
    })

    render(
      <TestWrapper>
        <List slug="blog" title="Blog" />
      </TestWrapper>
    )

    expect(
      screen.queryByRole('link', { name: 'Edit Collection' })
    ).not.toBeInTheDocument()
  })
})
