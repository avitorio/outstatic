import { UpgradeDialog } from '../upgrade-dialog'

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
})
