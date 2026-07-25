import { UpgradeDialog } from '../upgrade-dialog'
import { render, screen } from '@testing-library/react'

const { renderToString } =
  require('react-dom/server.node') as typeof import('react-dom/server')

describe('UpgradeDialog', () => {
  it('server-renders trigger children without mounting Radix dialog markup', () => {
    const html = renderToString(
      <UpgradeDialog>
        <button type="button">Upgrade</button>
      </UpgradeDialog>
    )

    expect(html).toContain('Upgrade')
    expect(html).not.toContain('radix-')
    expect(html).not.toContain('Upgrade to Pro')
  })

  it('routes demo users to the project flow selection step', async () => {
    render(
      <UpgradeDialog open feature="demo" accountSlug="my-team">
        <button type="button">Edit demo</button>
      </UpgradeDialog>
    )

    const link = await screen.findByRole('link', { name: /Create your own/i })
    const destination = new URL(link.getAttribute('href') ?? '')

    expect(destination.pathname).toBe('/home/my-team/')
    expect(destination.searchParams.get('new_project')).toBe('true')
    expect(destination.searchParams.get('new_project_flow')).toBeNull()
    expect(destination.searchParams.get('template_repository')).toBeNull()
    expect(link).toHaveAttribute('target', '_self')
  })
})
