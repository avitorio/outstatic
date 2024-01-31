import { render, screen } from '@testing-library/react'

import { dateToString } from '@/utils/tests/utils'
import DateTimePicker from '.'

describe('<DateTimePicker />', () => {
  it('should render the heading', () => {
    render(
      <DateTimePicker
        id="date"
        date={new Date('2022-07-14')}
        setDate={() => {}}
      />
    )

    expect(
      screen.getByRole('button', { name: dateToString(new Date('2022-07-14')) })
    ).toBeInTheDocument()
  })
})
