import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { FieldManagementPage } from '../field-management-page'

const mockUseFieldSchema = jest.fn()
const mockUseCollections = jest.fn()
const mockUseOutstatic = jest.fn()
const mockUseSingletons = jest.fn()

jest.mock('@/utils/hooks/use-field-schema', () => ({
  useFieldSchema: () => mockUseFieldSchema()
}))

jest.mock('@/utils/hooks', () => ({
  useCollections: () => mockUseCollections(),
  useOutstatic: () => mockUseOutstatic()
}))

jest.mock('@/utils/hooks/use-singletons', () => ({
  useSingletons: () => mockUseSingletons()
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn()
  })
}))

jest.mock('@/components/admin-layout', () => ({
  AdminLayout: ({
    children,
    title
  }: {
    children: ReactNode
    title: string
  }) => (
    <div>
      <div>{title}</div>
      {children}
    </div>
  )
}))

jest.mock('@/components/admin-loading', () => ({
  AdminLoading: () => <div>Loading</div>
}))

jest.mock('@/components/ui/outstatic/line-background', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>
}))

jest.mock('../field-dialog', () => ({
  FieldDialog: () => <div>Field dialog</div>
}))

jest.mock('../delete-field-dialog', () => ({
  DeleteFieldDialog: () => <div>Delete field dialog</div>
}))

jest.mock('../../collections/_components/delete-collection-modal', () => ({
  __esModule: true,
  default: () => <div>Delete collection modal</div>
}))

jest.mock('@/components/delete-document-button', () => ({
  DeleteDocumentButton: () => <button type="button">Delete Document</button>
}))

describe('<FieldManagementPage />', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockUseFieldSchema.mockReturnValue({
      data: { properties: {} },
      isLoading: false
    })

    mockUseCollections.mockReturnValue({
      data: [],
      isPending: false
    })

    mockUseSingletons.mockReturnValue({
      data: [{ slug: 'about', title: 'About', path: 'content/about.md' }],
      refetch: jest.fn()
    })

    mockUseOutstatic.mockReturnValue({
      dashboardRoute: '/outstatic'
    })
  })

  it('does not block singleton pages on a disabled collections query', () => {
    mockUseCollections.mockReturnValue({
      data: undefined,
      isPending: true
    })

    render(
      <FieldManagementPage
        target={{ kind: 'singleton', slug: 'about', title: 'About' }}
        emptyStateSubject="singleton"
      />
    )

    expect(screen.queryByText('Loading')).not.toBeInTheDocument()
    expect(screen.getByText('About Settings')).toBeInTheDocument()
  })

  it('keeps collection pages loading while collections are pending', () => {
    mockUseCollections.mockReturnValue({
      data: undefined,
      isPending: true
    })

    render(
      <FieldManagementPage
        target={{ kind: 'collection', slug: 'posts', title: 'Posts' }}
        emptyStateSubject="collection"
      />
    )

    expect(screen.getByText('Loading')).toBeInTheDocument()
  })
})
