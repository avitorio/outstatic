import { render, screen } from '@testing-library/react'

import React from 'react'
import { OutstaticProvider } from '../../context'
import Sidebar from '.'

const providerData = {
  repoSlug: 'anything',
  contentPath: 'anything',
  session: null,
  initialApolloState: null,
  contentTypes: ['posts', 'docs']
}

describe('<Sidebar />', () => {
  it('should render the heading', () => {
    render(
      <OutstaticProvider {...providerData}>
        <Sidebar isOpen={false} />
      </OutstaticProvider>
    )
    expect(screen.getByText(/Posts/i)).toBeInTheDocument()
    expect(screen.getByText(/Settings/i)).toBeInTheDocument()
  })
})
