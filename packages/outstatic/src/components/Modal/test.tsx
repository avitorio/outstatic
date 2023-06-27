import { render, screen } from '@testing-library/react'

import Modal from '.'

describe('<Modal />', () => {
  it('should render the heading', () => {
    render(
      <Modal close={() => {}} title="Hello Modal">
        This is the modal
      </Modal>
    )

    expect(
      screen.getByRole('heading', { name: /hello modal/i })
    ).toBeInTheDocument()
  })
})
