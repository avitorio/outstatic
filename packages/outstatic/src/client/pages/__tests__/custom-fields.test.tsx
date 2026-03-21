import { render, screen } from '@testing-library/react'
import CustomFields from '../custom-fields/custom-fields'

const mockUseFieldSchema = jest.fn()
const mockUseOutstatic = jest.fn()

jest.mock('@/utils/hooks/use-field-schema', () => ({
  useFieldSchema: () => mockUseFieldSchema()
}))
jest.mock('@/utils/hooks/use-outstatic', () => ({
  useOutstatic: () => mockUseOutstatic()
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
  })

  it('renders the unauthorized state when collections.manage is missing', () => {
    mockUseOutstatic.mockReturnValue({
      session: {
        user: {
          permissions: []
        }
      }
    })

    render(<CustomFields collection="posts" title="Posts" />)

    expect(
      screen.getByText('You are not authorized to access this page')
    ).toBeInTheDocument()
  })
})
