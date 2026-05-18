import { render, screen } from '@testing-library/react'
import CustomFields from '../custom-fields/custom-fields'

const mockUseFieldSchema = jest.fn()
const mockUseOutstatic = jest.fn()
const mockUseCollections = jest.fn()
const mockUseSingletons = jest.fn()
const mockUsePermissions = jest.fn()

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
jest.mock('@/utils/hooks/use-permissions', () => ({
  usePermissions: () => mockUsePermissions()
}))
jest.mock('@/utils/hooks/use-field-schema-commit', () => ({
  useFieldSchemaCommit: () => jest.fn()
}))
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn()
  }))
}))
jest.mock('change-case', () => ({
  capitalCase: (value: string) =>
    value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}))
jest.mock('@/components/admin-layout', () => ({
  AdminLayout: ({ children, title }: { children: any; title: string }) => (
    <div>
      <div>{title}</div>
      {children}
    </div>
  )
}))
jest.mock('@/components/admin-loading', () => ({
  AdminLoading: () => <div>Loading</div>
}))

describe('<CustomFields />', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseFieldSchema.mockReturnValue({
      data: null,
      isLoading: false
    })
    mockUseCollections.mockReturnValue({
      data: [],
      isPending: false
    })
    mockUseSingletons.mockReturnValue({
      data: [],
      refetch: jest.fn()
    })
    mockUseOutstatic.mockReturnValue({
      dashboardRoute: '/outstatic'
    })
  })

  it('renders the unauthorized state when collections.manage is missing', () => {
    mockUsePermissions.mockReturnValue({
      canManageCollections: false
    })

    render(<CustomFields collection="posts" title="Posts" />)

    expect(
      screen.getByText('You are not authorized to access this page')
    ).toBeInTheDocument()
  })
})
