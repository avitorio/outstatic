import { render, screen } from '@testing-library/react'
import SingletonFields from '../singleton-fields/singleton-fields'

const mockUseSingletons = jest.fn()

jest.mock('@/utils/hooks/use-singletons', () => ({
  useSingletons: () => mockUseSingletons()
}))
jest.mock('../_components/field-management-page', () => ({
  FieldManagementPage: ({ target }: { target: { title: string } }) => (
    <div>{target.title} Fields</div>
  )
}))

describe('<SingletonFields />', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the resolved singleton title', () => {
    mockUseSingletons.mockReturnValue({
      data: [{ slug: 'about', title: 'About' }]
    })

    render(<SingletonFields slug="about" />)

    expect(screen.getByText('About Fields')).toBeInTheDocument()
  })
})
