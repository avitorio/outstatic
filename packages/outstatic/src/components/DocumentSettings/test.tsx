import {
  TestProviders,
  TestWrapper,
  documentExample
} from '@/utils/TestWrapper'
import { useOstSession } from '@/utils/auth/hooks'
import { render, screen } from '@testing-library/react'
import DocumentSettings from '.'

jest.mock('@/utils/auth/hooks')
jest.mock('next/navigation', () => require('next-router-mock'))
jest.mock('next-navigation-guard', () => ({
  useNavigationGuard: jest.fn(),
  NavigationGuard: jest.fn().mockImplementation(({ children }) => children),
  useBlocker: jest.fn()
}))

jest.mock('react-hook-form', () => ({
  ...jest.requireActual('react-hook-form'),
  register: jest.fn(),
  handleSubmit: jest.fn()
}))

jest.mock('change-case', () => {
  return {
    split: (str: string) => str
  }
})

describe('<DocumentSettings />', () => {
  it('should render the date component', async () => {
    ;(useOstSession as jest.Mock).mockReturnValue({
      session: {
        user: {
          username: 'avitorio'
        }
      },
      status: 'authenticated'
    })
    render(
      <TestWrapper>
        <DocumentSettings
          saveDocument={() => {}}
          loading={false}
          showDelete={false}
          customFields={{}}
          setCustomFields={() => {}}
          metadata={{}}
        />
      </TestWrapper>
    )

    expect(screen.getByText('Pick a date')).toBeInTheDocument()
  })
  it('should handle empty author name', async () => {
    ;(useOstSession as jest.Mock).mockReturnValue({
      session: {
        user: {
          username: 'avitorio'
        }
      },
      status: 'authenticated'
    })

    render(
      <TestWrapper>
        <TestProviders.DocumentContext
          value={{
            document: { ...documentExample, author: { name: undefined } }
          }}
        >
          <TestProviders.Form>
            <DocumentSettings
              saveDocument={() => {}}
              loading={false}
              showDelete={false}
              customFields={{}}
              setCustomFields={() => {}}
              metadata={{}}
            />
          </TestProviders.Form>
        </TestProviders.DocumentContext>
      </TestWrapper>
    )
    expect(screen.getByLabelText('Name')).toHaveValue('')
    expect(screen.getByLabelText('Name')).not.toBeUndefined()
  })
})
