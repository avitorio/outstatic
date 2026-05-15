import { TiptapEditorProps } from './props'

const createClipboardEvent = (text: string) =>
  ({
    preventDefault: jest.fn(),
    clipboardData: {
      files: [],
      items: [],
      getData: jest.fn((type: string) => {
        if (type === 'text/plain') return text
        return ''
      })
    }
  }) as unknown as ClipboardEvent

const createEditorView = ({ empty }: { empty: boolean }) => {
  const mark = {
    create: jest.fn((attrs) => ({ attrs }))
  }
  const transaction: {
    addMark: jest.Mock
    scrollIntoView: jest.Mock
  } = {
    addMark: jest.fn(() => transaction),
    scrollIntoView: jest.fn(() => transaction)
  }

  return {
    view: {
      state: {
        selection: {
          empty,
          from: 3,
          to: 12
        },
        schema: {
          marks: {
            link: mark
          }
        },
        tr: transaction
      },
      dispatch: jest.fn()
    },
    mark,
    transaction
  }
}

describe('TiptapEditorProps', () => {
  it.each([
    ['example.com', 'https://example.com/'],
    ['https://example.com', 'https://example.com']
  ])(
    'turns selected text into a link when %s is pasted',
    (clipboardText, href) => {
      const event = createClipboardEvent(clipboardText)
      const { view, mark, transaction } = createEditorView({ empty: false })

      const handled = TiptapEditorProps.handlePaste?.(
        view as any,
        event,
        null as any
      )

      expect(handled).toBe(true)
      expect(event.preventDefault).toHaveBeenCalledTimes(1)
      expect(mark.create).toHaveBeenCalledWith({ href })
      expect(transaction.addMark).toHaveBeenCalledWith(3, 12, {
        attrs: { href }
      })
      expect(transaction.scrollIntoView).toHaveBeenCalledTimes(1)
      expect(view.dispatch).toHaveBeenCalledWith(transaction)
    }
  )

  it.each(['hello world', 'javascript:alert(1)'])(
    'falls back to normal paste behavior when selected text receives %s',
    (clipboardText) => {
      const event = createClipboardEvent(clipboardText)
      const { view, mark, transaction } = createEditorView({ empty: false })

      const handled = TiptapEditorProps.handlePaste?.(
        view as any,
        event,
        null as any
      )

      expect(handled).toBe(false)
      expect(event.preventDefault).not.toHaveBeenCalled()
      expect(mark.create).not.toHaveBeenCalled()
      expect(transaction.addMark).not.toHaveBeenCalled()
      expect(view.dispatch).not.toHaveBeenCalled()
    }
  )

  it('falls back to normal paste behavior when the selection is empty', () => {
    const event = createClipboardEvent('https://example.com')
    const { view } = createEditorView({ empty: true })

    const handled = TiptapEditorProps.handlePaste?.(
      view as any,
      event,
      null as any
    )

    expect(handled).toBe(false)
    expect(event.preventDefault).not.toHaveBeenCalled()
    expect(view.dispatch).not.toHaveBeenCalled()
  })
})
