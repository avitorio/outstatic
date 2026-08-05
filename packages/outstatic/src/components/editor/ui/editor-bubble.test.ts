import { shouldShowEditorBubble } from './editor-bubble'

const createVisibilityArgs = (activeNode?: string) =>
  ({
    editor: {
      isEditable: true,
      isActive: jest.fn((node: string) => node === activeNode)
    },
    state: {
      selection: {
        empty: false
      }
    }
  }) as any

describe('shouldShowEditorBubble', () => {
  it('shows for a non-empty prose selection', () => {
    expect(shouldShowEditorBubble(createVisibilityArgs())).toBe(true)
  })

  it.each(['codeBlock', 'mdxBlock'])(
    'does not show inside a %s',
    (activeNode) => {
      expect(shouldShowEditorBubble(createVisibilityArgs(activeNode))).toBe(
        false
      )
    }
  )
})
