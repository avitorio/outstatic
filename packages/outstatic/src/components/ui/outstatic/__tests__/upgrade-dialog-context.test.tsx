import { fireEvent, render, screen } from '@testing-library/react'

import { useOutstatic } from '@/utils/hooks/use-outstatic'
import {
  UpgradeDialogProvider,
  useUpgradeDialog
} from '../upgrade-dialog-context'

jest.mock('@/utils/hooks/use-outstatic', () => ({
  useOutstatic: jest.fn()
}))

jest.mock('@/components/ui/outstatic/upgrade-dialog', () => ({
  UpgradeDialog: ({
    open = false,
    onOpenChange,
    feature,
    accountSlug,
    dashboardRoute
  }: {
    open?: boolean
    onOpenChange?: (open: boolean) => void
    feature?: 'team' | 'api-keys' | 'ai'
    accountSlug?: string
    dashboardRoute?: string
  }) => (
    <div
      data-testid="upgrade-dialog"
      data-open={String(open)}
      data-feature={feature ?? ''}
      data-account-slug={accountSlug ?? ''}
      data-dashboard-route={dashboardRoute ?? ''}
    >
      <button type="button" onClick={() => onOpenChange?.(false)}>
        Close Dialog
      </button>
    </div>
  )
}))

const mockUseOutstatic = useOutstatic as jest.Mock

function TestConsumer() {
  const { isUpgradeDialogOpen, openUpgradeDialog, setUpgradeDialogOpen } =
    useUpgradeDialog()

  return (
    <div>
      <button type="button" onClick={() => openUpgradeDialog()}>
        Open Default
      </button>
      <button
        type="button"
        onClick={() => openUpgradeDialog('override-team', '/custom-dashboard')}
      >
        Open Override
      </button>
      <button type="button" onClick={() => setUpgradeDialogOpen(true)}>
        Open With Setter
      </button>
      <button type="button" onClick={() => setUpgradeDialogOpen(false)}>
        Close With Setter
      </button>
      <div data-testid="context-open-state">{String(isUpgradeDialogOpen)}</div>
    </div>
  )
}

describe('UpgradeDialog context', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseOutstatic.mockReturnValue({
      dashboardRoute: '/outstatic',
      projectInfo: {
        accountSlug: 'default-team'
      }
    })
  })

  it('throws when useUpgradeDialog is used outside provider', () => {
    function OutsideProviderConsumer() {
      useUpgradeDialog()
      return null
    }

    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    expect(() => render(<OutsideProviderConsumer />)).toThrow(
      'useUpgradeDialog must be used within UpgradeDialogProvider'
    )

    consoleErrorSpy.mockRestore()
  })

  it('uses the default feature when no feature prop is provided', () => {
    render(
      <UpgradeDialogProvider>
        <TestConsumer />
      </UpgradeDialogProvider>
    )

    expect(screen.getByTestId('upgrade-dialog')).toHaveAttribute(
      'data-feature',
      'team'
    )
  })

  it('opens the dialog with project defaults via openUpgradeDialog', () => {
    render(
      <UpgradeDialogProvider feature="ai">
        <TestConsumer />
      </UpgradeDialogProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Open Default' }))

    expect(screen.getByTestId('context-open-state')).toHaveTextContent('true')
    expect(screen.getByTestId('upgrade-dialog')).toHaveAttribute(
      'data-open',
      'true'
    )
    expect(screen.getByTestId('upgrade-dialog')).toHaveAttribute(
      'data-account-slug',
      'default-team'
    )
    expect(screen.getByTestId('upgrade-dialog')).toHaveAttribute(
      'data-dashboard-route',
      '/outstatic'
    )
    expect(screen.getByTestId('upgrade-dialog')).toHaveAttribute(
      'data-feature',
      'ai'
    )
  })

  it('supports overriding values and resets overrides when closed', () => {
    render(
      <UpgradeDialogProvider>
        <TestConsumer />
      </UpgradeDialogProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Open Override' }))
    expect(screen.getByTestId('upgrade-dialog')).toHaveAttribute(
      'data-account-slug',
      'override-team'
    )
    expect(screen.getByTestId('upgrade-dialog')).toHaveAttribute(
      'data-dashboard-route',
      '/custom-dashboard'
    )

    fireEvent.click(screen.getByRole('button', { name: 'Close Dialog' }))
    expect(screen.getByTestId('context-open-state')).toHaveTextContent('false')

    fireEvent.click(screen.getByRole('button', { name: 'Open Default' }))
    expect(screen.getByTestId('upgrade-dialog')).toHaveAttribute(
      'data-account-slug',
      'default-team'
    )
    expect(screen.getByTestId('upgrade-dialog')).toHaveAttribute(
      'data-dashboard-route',
      '/outstatic'
    )
  })

  it('lets consumers toggle dialog state using setUpgradeDialogOpen', () => {
    render(
      <UpgradeDialogProvider>
        <TestConsumer />
      </UpgradeDialogProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Open With Setter' }))
    expect(screen.getByTestId('context-open-state')).toHaveTextContent('true')
    expect(screen.getByTestId('upgrade-dialog')).toHaveAttribute(
      'data-open',
      'true'
    )

    fireEvent.click(screen.getByRole('button', { name: 'Close With Setter' }))
    expect(screen.getByTestId('context-open-state')).toHaveTextContent('false')
    expect(screen.getByTestId('upgrade-dialog')).toHaveAttribute(
      'data-open',
      'false'
    )
  })
})
