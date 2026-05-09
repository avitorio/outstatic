import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { MdxBlock } from './mdx-block'
import { createSlashCommand, isSlashCommandAllowed } from './slash-command'

jest.mock(
  '@/components/editor/extensions/slash-command/BaseCommandList',
  () => ({
    BaseCommandList: () => null
  })
)

jest.mock(
  '@/components/editor/extensions/slash-command/ImageCommandList',
  () => ({
    __esModule: true,
    default: () => null
  })
)

const testLowlight = {
  listLanguages: () => ['jsx'],
  highlight: (_language: string, value: string) => ({
    children: [
      {
        type: 'text',
        value
      }
    ]
  }),
  highlightAuto: (value: string) => ({
    children: [
      {
        type: 'text',
        value
      }
    ]
  })
}

const createEditor = (content: object | string) =>
  new Editor({
    content,
    extensions: [
      StarterKit,
      MdxBlock.configure({
        lowlight: testLowlight
      })
    ]
  })

describe('slash-command', () => {
  it('keeps the slash suggestion allow hook configured', () => {
    const extension = createSlashCommand({
      onShowUpgradeDialog: jest.fn()
    })

    expect(extension.options.suggestion.allow).toBe(isSlashCommandAllowed)
  })

  it('allows slash commands in normal editor content', () => {
    const editor = createEditor('<p>/</p>')

    expect(
      isSlashCommandAllowed({
        state: editor.state,
        range: { from: 1, to: 2 }
      })
    ).toBe(true)
  })

  it('blocks slash commands inside MDX blocks', () => {
    const editor = createEditor({
      type: 'doc',
      content: [
        {
          type: 'mdxBlock',
          content: [
            {
              type: 'text',
              text: '/'
            }
          ]
        }
      ]
    })

    expect(
      isSlashCommandAllowed({
        state: editor.state,
        range: { from: 1, to: 2 }
      })
    ).toBe(false)
  })
})
