import { render, screen } from '@testing-library/react'
import SingletonFields from '../singleton-fields/singleton-fields'

const mockUseFieldSchema = jest.fn()
const mockUseSingletons = jest.fn()

jest.mock('@/utils/hooks/use-field-schema', () => ({
  useFieldSchema: () => mockUseFieldSchema()
}))
jest.mock('@/utils/hooks/use-singletons', () => ({
  useSingletons: () => mockUseSingletons()
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
jest.mock('@/components/ui/outstatic/line-background', () => ({
  __esModule: true,
  default: ({ children }: { children: any }) => <div>{children}</div>
}))
jest.mock('../_components/field-dialog', () => ({
  FieldDialog: () => null
}))
jest.mock('../_components/delete-field-dialog', () => ({
  DeleteFieldDialog: () => null
}))

describe('<SingletonFields />', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseFieldSchema.mockReturnValue({
      data: null,
      isLoading: false
    })
  })

  it('renders the resolved singleton title', () => {
    mockUseSingletons.mockReturnValue({
      data: [{ slug: 'about', title: 'About' }]
    })

    render(<SingletonFields slug="about" />)

    expect(screen.getByText('About Fields')).toBeInTheDocument()
  })
})
