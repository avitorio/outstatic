import { render, screen } from '@testing-library/react'
import { DynamicIcon, iconNames } from './dynamic-icon'

describe('DynamicIcon', () => {
  it('renders icons by dynamic lucide icon names', () => {
    expect(iconNames).toEqual(
      expect.arrayContaining([
        'alert-circle',
        'circle-alert',
        'help-circle',
        'play-circle'
      ])
    )

    render(<DynamicIcon name="help-circle" aria-label="Help icon" />)

    expect(screen.getByLabelText('Help icon').tagName).toBe('svg')
  })

  it('renders the fallback for unknown icons', () => {
    render(
      <DynamicIcon
        name="unknown-icon"
        fallback={() => <span>Fallback icon</span>}
      />
    )

    expect(screen.getByText('Fallback icon')).toBeInTheDocument()
  })
})
