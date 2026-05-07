import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'
import { MdxBlock } from '../mdx-block'
import { getSuggestionItems } from './get-suggestion-items'

describe('getSuggestionItems', () => {
  it('includes an MDX/HTML command that inserts an mdx block', () => {
    const item = getSuggestionItems({ query: 'mdx' }).find(
      (item) => item.title === 'MDX/HTML'
    )
    const range = { from: 1, to: 4 }
    const chain = {
      focus: jest.fn().mockReturnThis(),
      deleteRange: jest.fn().mockReturnThis(),
      setMdxBlock: jest.fn().mockReturnThis(),
      run: jest.fn().mockReturnThis()
    }
    const editor = {
      chain: jest.fn(() => chain)
    } as any

    item?.command?.({ editor, range })

    expect(item).toBeDefined()
    expect(chain.deleteRange).toHaveBeenCalledWith(range)
    expect(chain.setMdxBlock).toHaveBeenCalledTimes(1)
    expect(chain.run).toHaveBeenCalledTimes(1)
  })

  it('inserts an mdx block in a real editor instance', () => {
    const item = getSuggestionItems({ query: 'mdx' }).find(
      (item) => item.title === 'MDX/HTML'
    )
    const editor = new Editor({
      content: '/',
      extensions: [
        Markdown.configure({
          html: false,
          linkify: false
        }),
        StarterKit,
        MdxBlock
      ]
    })

    item?.command?.({
      editor,
      range: {
        from: 1,
        to: 2
      }
    })

    expect(editor.state.doc.firstChild?.type.name).toBe('mdxBlock')
    expect(editor.state.doc.firstChild?.attrs.raw).toBe('')
  })
})
