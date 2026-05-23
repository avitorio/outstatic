import { fireEvent, render, screen } from '@testing-library/react'
import { useCompletion } from '@ai-sdk/react'
import { useOutstatic } from '@/utils/hooks/use-outstatic'
import { getPrevText } from '@/components/editor/utils/get-prev-text'
import { BaseCommandList } from './BaseCommandList'

jest.mock('@ai-sdk/react', () => ({
  useCompletion: jest.fn()
}))

jest.mock('@/utils/hooks/use-outstatic', () => ({
  useOutstatic: jest.fn()
}))

jest.mock('@/components/editor/utils/get-prev-text', () => ({
  getPrevText: jest.fn()
}))

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    message: jest.fn()
  }
}))

jest.mock('@/components/editor/extensions/slash-command', () => ({
  updateScrollView: jest.fn()
}))

const mockUseCompletion = useCompletion as unknown as jest.Mock
const mockUseOutstatic = useOutstatic as unknown as jest.Mock
const mockGetPrevText = getPrevText as unknown as jest.Mock

describe('BaseCommandList AI gating', () => {
  const complete = jest.fn()
  const onShowUpgradeDialog = jest.fn()
  const setImageMenu = jest.fn()
  const command = jest.fn()
  const range = { from: 3, to: 6 }

  const chain = {
    focus: jest.fn().mockReturnThis(),
    deleteRange: jest.fn().mockReturnThis(),
    setMdxBlock: jest.fn().mockReturnThis(),
    run: jest.fn().mockReturnThis()
  }

  const editor = {
    chain: jest.fn(() => chain),
    commands: {},
    state: {
      selection: {
        from: 1
      }
    }
  } as any

  const items = [
    {
      title: 'Continue writing',
      description: 'Use AI to expand your thoughts.',
      icon: <span>AI</span>,
      searchTerms: []
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()

    mockUseOutstatic.mockReturnValue({
      hasAIProviderKey: false,
      isPro: false,
      basePath: '/outstatic',
      dashboardRoute: '/dashboard',
      projectInfo: { accountSlug: 'team-slug' }
    })

    mockUseCompletion.mockReturnValue({
      complete,
      isLoading: false
    })

    mockGetPrevText.mockReturnValue('Existing content')
  })

  it('shows the upgrade dialog when AI access is not available', () => {
    render(
      <BaseCommandList
        items={items}
        command={command}
        setImageMenu={setImageMenu}
        editor={editor}
        range={range}
        onShowUpgradeDialog={onShowUpgradeDialog}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /continue writing/i }))

    expect(chain.deleteRange).toHaveBeenCalledWith(range)
    expect(onShowUpgradeDialog).toHaveBeenCalledWith('team-slug', '/dashboard')
    expect(mockGetPrevText).not.toHaveBeenCalled()
    expect(complete).not.toHaveBeenCalled()
  })

  it('starts AI completion when AI access is available', () => {
    mockUseOutstatic.mockReturnValue({
      hasAIProviderKey: true,
      isPro: false,
      basePath: '/outstatic',
      dashboardRoute: '/dashboard',
      projectInfo: { accountSlug: 'team-slug' }
    })

    render(
      <BaseCommandList
        items={items}
        command={command}
        setImageMenu={setImageMenu}
        editor={editor}
        range={range}
        onShowUpgradeDialog={onShowUpgradeDialog}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /continue writing/i }))

    expect(onShowUpgradeDialog).not.toHaveBeenCalled()
    expect(mockGetPrevText).toHaveBeenCalledWith(editor, {
      chars: 5000,
      offset: 1
    })
    expect(complete).toHaveBeenCalledWith('Existing content', {
      body: { option: 'continue', command: '' }
    })
  })

  it('inserts custom blocks directly into the editor', () => {
    const block = {
      name: 'Callout',
      description: 'Highlight content',
      props: [
        {
          name: 'title',
          type: 'String' as const,
          defaultValue: 'Heads up'
        }
      ]
    }

    render(
      <BaseCommandList
        items={[
          {
            title: 'Callout',
            description: 'Highlight content',
            icon: <span>Block</span>,
            searchTerms: [],
            block
          }
        ]}
        command={command}
        setImageMenu={setImageMenu}
        editor={editor}
        range={range}
        onShowUpgradeDialog={onShowUpgradeDialog}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /callout/i }))

    const insertedItem = command.mock.calls[0][0]
    insertedItem.command({ editor, range })

    expect(chain.deleteRange).toHaveBeenCalledWith(range)
    expect(chain.setMdxBlock).toHaveBeenCalledWith({
      raw: '<Callout title="Heads up" />',
      outstaticBlockName: 'Callout',
      outstaticBlockValues: JSON.stringify({ title: 'Heads up' }),
      outstaticBlockDefinition: JSON.stringify(block),
      outstaticBlockFocusKey: expect.any(String)
    })
    expect(setImageMenu).not.toHaveBeenCalled()
  })
})
