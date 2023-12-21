import { render, screen } from '@testing-library/react'
import DocumentSettings from '.'
import { TestWrapper } from '../../utils/TestWrapper'
import { useOstSession } from '../../utils/auth/hooks'
import { dateToString } from '../../utils/tests/utils'

jest.mock('../../utils/auth/hooks')
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
})
