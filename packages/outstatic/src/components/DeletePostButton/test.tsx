import { render, screen } from '@testing-library/react'
import React from 'react'
import { TestWrapper } from '../../utils/TestWrapper'
import { useOstSession } from '../../utils/auth/hooks'
import DeletePostButton from '.'

jest.mock('../../utils/auth/hooks')

describe('<DeletePostButton />', () => {
  it('should render the button', () => {
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
        <DeletePostButton slug={'a-post'} disabled={false} />
      </TestWrapper>
    )

    expect(screen.getByRole('button', { name: /Delete/i })).toBeInTheDocument()
  })
})
