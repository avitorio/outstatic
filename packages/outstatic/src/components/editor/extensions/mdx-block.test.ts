import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'
import { MdxBlock, getMdxOpening, isMdxEsmLine } from './mdx-block'

const createEditor = (content: string) =>
  new Editor({
    content,
    extensions: [
      Markdown.configure({
        html: false,
        linkify: false
      }),
      StarterKit,
      MdxBlock
    ]
  })

describe('MdxBlock', () => {
  it('inserts an empty block instead of storing placeholder content', () => {
    const editor = createEditor('')

    editor.commands.setMdxBlock()

    expect(editor.state.doc.firstChild?.attrs.raw).toBe('')
    expect(editor.storage.markdown.getMarkdown().trim()).toBe('')
  })

  it('round-trips a self-closing MDX component without escaping brackets', () => {
    const editor = createEditor('<MyComponent />')

    expect(editor.storage.markdown.getMarkdown().trim()).toBe('<MyComponent />')
  })

  it('round-trips multiline MDX blocks with children', () => {
    const mdx = `<MyComponent title="Hello">
  <Child />
</MyComponent>`
    const editor = createEditor(mdx)

    expect(editor.storage.markdown.getMarkdown().trim()).toBe(mdx)
  })

  it('round-trips raw MDX attributes with newlines', () => {
    const mdx = `<Callout>
Line one
Line two
</Callout>`
    const editor = createEditor(mdx)

    expect(editor.state.doc.firstChild?.attrs.raw).toBe(mdx)
    expect(editor.storage.markdown.getMarkdown().trim()).toBe(mdx)
  })

  it('round-trips consecutive MDX import statements in one block', () => {
    const imports = `import Callout from '@/components/examples/Callout.astro'
import CounterButton from '@/components/examples/CounterButton.astro'
import Tag from '@/components/examples/Tag.astro'`
    const editor = createEditor(imports)

    expect(editor.state.doc.childCount).toBe(1)
    expect(editor.state.doc.firstChild?.attrs.raw).toBe(imports)
    expect(editor.storage.markdown.getMarkdown().trim()).toBe(imports)
  })

  it('round-trips multiline import statements', () => {
    const imports = `import {
  Callout,
  Tag
} from '@/components/examples'`
    const editor = createEditor(imports)

    expect(editor.state.doc.firstChild?.attrs.raw).toBe(imports)
    expect(editor.storage.markdown.getMarkdown().trim()).toBe(imports)
  })

  it('round-trips top-level multiline export statements', () => {
    const mdx = `export const metadata = {
  title: 'Hello'
}

# Title`
    const editor = createEditor(mdx)

    expect(editor.storage.markdown.getMarkdown().trim()).toBe(mdx)
  })

  it('keeps imports and JSX as separate raw MDX blocks', () => {
    const mdx = `import Callout from '@/components/Callout'

<Callout />`
    const editor = createEditor(mdx)

    expect(editor.state.doc.childCount).toBe(2)
    expect(editor.storage.markdown.getMarkdown().trim()).toBe(mdx)
  })

  it('keeps unclosed JSX content until a blank-line boundary', () => {
    const mdx = `<MyComponent>
Body

Next paragraph`
    const editor = createEditor(mdx)

    expect(editor.storage.markdown.getMarkdown().trim()).toBe(mdx)
  })

  it('keeps unclosed JSX content through EOF when there is no blank-line boundary', () => {
    const mdx = `<MyComponent>
Body`
    const editor = createEditor(mdx)

    expect(editor.state.doc.firstChild?.attrs.raw).toBe(mdx)
    expect(editor.storage.markdown.getMarkdown().trim()).toBe(mdx)
  })

  it('preserves regular markdown serialization', () => {
    const editor = createEditor('# Title\n\nHello **world**')

    expect(editor.storage.markdown.getMarkdown().trim()).toBe(
      '# Title\n\nHello **world**'
    )
  })

  it('does not treat escaped bracket content inside inline code as MDX', () => {
    const editor = createEditor('Use `<MyComponent />` here.')

    expect(editor.storage.markdown.getMarkdown().trim()).toBe(
      'Use `<MyComponent />` here.'
    )
  })

  it('does not treat import statements inside fenced code as MDX', () => {
    const mdx = "```ts\nimport Callout from '@/components/Callout'\n```"
    const editor = createEditor(mdx)

    expect(editor.storage.markdown.getMarkdown().trim()).toBe(mdx)
  })

  it('does not treat prose beginning with import as MDX ESM', () => {
    const editor = createEditor('import something into your story.')

    expect(editor.storage.markdown.getMarkdown().trim()).toBe(
      'import something into your story.'
    )
  })

  it('detects component and html opening tags', () => {
    expect(getMdxOpening('<MyComponent />')).toEqual({
      tagName: 'MyComponent',
      isFragment: false
    })
    expect(getMdxOpening('<section>')).toEqual({
      tagName: 'section',
      isFragment: false
    })
    expect(getMdxOpening('&lt;MyComponent /&gt;')).toBeNull()
  })

  it('detects only import and export starts as MDX ESM candidates', () => {
    expect(isMdxEsmLine("import Callout from '@/components/Callout'")).toBe(
      true
    )
    expect(isMdxEsmLine('export const metadata = {}')).toBe(true)
    expect(isMdxEsmLine('This paragraph says import something.')).toBe(false)
  })
})
