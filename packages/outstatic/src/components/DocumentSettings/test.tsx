import {
  TestProviders,
  TestWrapper,
  documentExample
} from '@/utils/TestWrapper'
import { useOstSession } from '@/utils/auth/hooks'
import { dateToString } from '@/utils/tests/utils'
import { render, screen } from '@testing-library/react'
import DocumentSettings from '.'

jest.mock('@/utils/auth/hooks')
jest.mock('next/navigation', () => require('next-router-mock'))

jest.mock('react-hook-form', () => ({
  ...jest.requireActual('react-hook-form'),
  register: jest.fn(),
  handleSubmit: jest.fn()
}))

describe('<DocumentSettings />', () => {
  it('should render the date', async () => {
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
          saveFunc={() => {}}
          loading={false}
          showDelete={false}
        />
      </TestWrapper>
    )

    expect(
      screen.getByText(dateToString(new Date('2022-07-14')))
    ).toBeInTheDocument()
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
      <TestProviders.Apollo>
        <TestProviders.DocumentContext
          value={{
            document: { ...documentExample, author: { name: undefined } }
          }}
        >
          <TestProviders.Form>
            <DocumentSettings
              saveFunc={() => {}}
              loading={false}
              showDelete={false}
            />
          </TestProviders.Form>
        </TestProviders.DocumentContext>
      </TestProviders.Apollo>
    )
    expect(screen.getByLabelText('Name')).toHaveValue('')
    expect(screen.getByLabelText('Name')).not.toBeUndefined()
  })
})
