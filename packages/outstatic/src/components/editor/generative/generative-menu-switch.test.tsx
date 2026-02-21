import { fireEvent, render, screen } from '@testing-library/react'
import { useOutstatic } from '@/utils/hooks/useOutstatic'
import { useUpgradeDialog } from '@/components/ui/outstatic/upgrade-dialog-context'
import GenerativeMenuSwitch from './generative-menu-switch'

jest.mock('@/utils/hooks/useOutstatic', () => ({
  useOutstatic: jest.fn()
}))

jest.mock('@/components/ui/outstatic/upgrade-dialog-context', () => ({
  useUpgradeDialog: jest.fn()
}))

jest.mock('../ui/editor-bubble', () => ({
  EditorBubble: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="editor-bubble">{children}</div>
  )
}))

jest.mock('@/components/editor/ui/editor-bubble-button', () => ({
  EditorBubbleButton: ({
    children,
    onClick,
    name
  }: {
    children: React.ReactNode
    onClick: () => void
    name: string
  }) => (
    <button type="button" onClick={onClick} data-testid={name}>
      {children}
    </button>
  )
}))

jest.mock('./ai-selector', () => ({
  AISelector: () => <div data-testid="ai-selector" />
}))

jest.mock('@/components/editor/extensions/ai-higlight', () => ({
  removeAIHighlight: jest.fn()
}))

const mockUseOutstatic = useOutstatic as unknown as jest.Mock
const mockUseUpgradeDialog = useUpgradeDialog as unknown as jest.Mock

describe('GenerativeMenuSwitch AI gating', () => {
  const openUpgradeDialog = jest.fn()
  const onOpenChange = jest.fn()

  const chain = {
    setTextSelection: jest.fn().mockReturnThis(),
    run: jest.fn().mockReturnThis(),
    unsetHighlight: jest.fn().mockReturnThis()
  }

  const editor = {
    state: {
      selection: {
        from: 7
      }
    },
    chain: jest.fn(() => chain)
  } as any

  beforeEach(() => {
    jest.clearAllMocks()

    mockUseUpgradeDialog.mockReturnValue({
      openUpgradeDialog
    })

    mockUseOutstatic.mockReturnValue({
      hasAIProviderKey: false,
      isPro: false
    })
  })

  it('opens upgrade dialog when Ask AI is clicked without AI access', () => {
    render(
      <GenerativeMenuSwitch
        editor={editor}
        open={false}
        onOpenChange={onOpenChange}
      >
        <div>Child Action</div>
      </GenerativeMenuSwitch>
    )

    fireEvent.click(screen.getByTestId('ask-ai'))

    expect(chain.setTextSelection).toHaveBeenCalledWith(7)
    expect(openUpgradeDialog).toHaveBeenCalledTimes(1)
    expect(onOpenChange).not.toHaveBeenCalledWith(true)
  })

  it('opens the AI selector when Ask AI is clicked with AI access', () => {
    mockUseOutstatic.mockReturnValue({
      hasAIProviderKey: true,
      isPro: false
    })

    render(
      <GenerativeMenuSwitch
        editor={editor}
        open={false}
        onOpenChange={onOpenChange}
      >
        <div>Child Action</div>
      </GenerativeMenuSwitch>
    )

    fireEvent.click(screen.getByTestId('ask-ai'))

    expect(onOpenChange).toHaveBeenCalledWith(true)
    expect(openUpgradeDialog).not.toHaveBeenCalled()
    expect(chain.setTextSelection).not.toHaveBeenCalled()
  })
})
