import { Editor } from '@tiptap/core'
import { act, render, waitFor } from '@testing-library/react'
import { EditorContent } from '@tiptap/react'
import { createElement } from 'react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'
import { createMdxLowlight } from './mdx-lowlight'
import { MdxBlock, getMdxOpening, isMdxEsmLine } from '.'
import { validateMdxBlock } from './mdx-validation'

const testLowlight = {
  listLanguages: () => ['jsx', 'xml'],
  registered: (language: string) => ['jsx', 'xml'].includes(language),
  highlight: (language: string, value: string) => {
    if (language === 'jsx' && value.startsWith('import')) {
      return {
        children: [
          {
            type: 'element',
            properties: {
              className: ['hljs-keyword']
            },
            children: [
              {
                type: 'text',
                value: 'import'
              }
            ]
          },
          {
            type: 'text',
            value: value.slice('import'.length)
          }
        ]
      }
    }

    if (language === 'xml' && value.startsWith('<Callout')) {
      return {
        children: [
          {
            type: 'text',
            value: '<'
          },
          {
            type: 'element',
            properties: {
              className: ['hljs-name']
            },
            children: [
              {
                type: 'text',
                value: 'Callout'
              }
            ]
          },
          {
            type: 'text',
            value: ' '
          },
          {
            type: 'element',
            properties: {
              className: ['hljs-attr']
            },
            children: [
              {
                type: 'text',
                value: 'className'
              }
            ]
          },
          {
            type: 'text',
            value: '="foo" '
          },
          {
            type: 'element',
            properties: {
              className: ['hljs-attr']
            },
            children: [
              {
                type: 'text',
                value: 'title'
              }
            ]
          },
          {
            type: 'text',
            value: value.includes('onClick')
              ? '="Hi" onClick={() => setOpen(true)} />'
              : '="Hi" />'
          }
        ]
      }
    }

    return {
      children: [
        {
          type: 'text',
          value
        }
      ]
    }
  },
  highlightAuto: (value: string) => ({
    children: [
      {
        type: 'text',
        value
      }
    ]
  })
}

const mdxLowlight = createMdxLowlight(testLowlight)

const getHighlightedText = (editor: Editor, selector: string) =>
  Array.from(editor.view.dom.querySelectorAll(selector)).map(
    (node) => node.textContent
  )

const getTrackingLowlight = () => {
  const calls: Array<{ language: string; value: string }> = []

  return {
    calls,
    lowlight: createMdxLowlight({
      ...testLowlight,
      highlight: (language: string, value: string) => {
        calls.push({ language, value })

        return {
          children: [
            {
              type: 'text',
              value
            }
          ]
        }
      }
    })
  }
}

const createEditor = (content: string) =>
  new Editor({
    content,
    extensions: [
      Markdown.configure({
        html: false,
        linkify: false
      }),
      StarterKit,
      MdxBlock.configure({
        lowlight: mdxLowlight
      })
    ]
  })

describe('MdxBlock', () => {
  it('validates an empty MDX block', () => {
    expect(validateMdxBlock('')).toEqual({ valid: true })
  })

  it('validates import and export blocks', () => {
    expect(
      validateMdxBlock("import Callout from '@/components/Callout'")
    ).toEqual({ valid: true })
    expect(
      validateMdxBlock('export const metadata = { title: "Hello" }')
    ).toEqual({ valid: true })
  })

  it('marks incomplete import and export blocks as invalid', () => {
    expect(validateMdxBlock('import { Callout')).toEqual({
      valid: false,
      message: 'Invalid import/export statement.'
    })
    expect(validateMdxBlock('export const metadata =')).toEqual({
      valid: false,
      message: 'Invalid import/export statement.'
    })
  })

  it('validates self-closing MDX components', () => {
    expect(validateMdxBlock('<Callout className="foo" />')).toEqual({
      valid: true
    })
  })

  it('validates MDX components with template literal props', () => {
    expect(
      validateMdxBlock('<Callout className={`foo-${bar > 1}`} />')
    ).toEqual({
      valid: true
    })
  })

  it('validates multiline MDX components with children', () => {
    expect(
      validateMdxBlock(`<Callout>
  <span>Text</span>
</Callout>`)
    ).toEqual({ valid: true })
  })

  it('marks MDX components with missing closing tags as invalid', () => {
    expect(validateMdxBlock('<Callout>\nBody')).toEqual({
      valid: false,
      message: 'Missing closing </Callout> tag.'
    })
    expect(validateMdxBlock('<Callout>\n<span>Text\n</Callout>')).toEqual({
      valid: false,
      message: 'Missing closing </span> tag.'
    })
  })

  it('marks unsupported raw text as invalid', () => {
    expect(validateMdxBlock('plain text')).toEqual({
      valid: false,
      message: 'MDX blocks must start with import, export, or JSX/HTML.'
    })
  })

  it('renders a non-blocking validation warning for invalid MDX blocks', async () => {
    const editor = createEditor('')
    const { container } = render(
      createElement(EditorContent, { editor: editor as any })
    )

    act(() => {
      editor.commands.setMdxBlock({ raw: '<Callout>\nBody' })
    })

    await waitFor(() => {
      expect(
        container.querySelector('button[aria-label^="MDX validation warning:"]')
      ).toBeInTheDocument()
      expect(
        container.querySelector('[aria-label="MDX block content"]')
      ).toHaveAttribute('aria-invalid', 'true')
    })
    expect(container.textContent).not.toContain(
      'Missing closing </Callout> tag.'
    )
    expect(editor.storage.markdown.getMarkdown().trim()).toBe('<Callout>\nBody')
  })

  it('inserts an empty block instead of storing placeholder content', () => {
    const editor = createEditor('')

    editor.commands.setMdxBlock()

    expect(editor.state.doc.firstChild?.textContent).toBe('')
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

  it('round-trips multiline MDX blocks with JSX attribute expressions', () => {
    const mdx = `<Callout condition={foo && <Badge />}>
Body
</Callout>`
    const editor = createEditor(mdx)

    expect(editor.state.doc.firstChild?.textContent).toBe(mdx)
    expect(editor.storage.markdown.getMarkdown().trim()).toBe(mdx)
  })

  it('round-trips multiline MDX blocks with self-closing text inside attributes', () => {
    const mdx = '<Callout pattern={`/>`}>\nBody\n</Callout>'
    const editor = createEditor(mdx)

    expect(editor.state.doc.firstChild?.textContent).toBe(mdx)
    expect(editor.storage.markdown.getMarkdown().trim()).toBe(mdx)
  })

  it('round-trips raw MDX attributes with newlines', () => {
    const mdx = `<Callout>
Line one
Line two
</Callout>`
    const editor = createEditor(mdx)

    expect(editor.state.doc.firstChild?.textContent).toBe(mdx)
    expect(editor.storage.markdown.getMarkdown().trim()).toBe(mdx)
  })

  it('round-trips a JSX fragment block', () => {
    const mdx = `<>
  <span>Hi</span>
</>`
    const editor = createEditor(mdx)

    expect(editor.storage.markdown.getMarkdown().trim()).toBe(mdx)
  })

  it('round-trips consecutive MDX import statements in one block', () => {
    const imports = `import Callout from '@/components/examples/Callout.astro'
import CounterButton from '@/components/examples/CounterButton.astro'
import Tag from '@/components/examples/Tag.astro'`
    const editor = createEditor(imports)

    expect(editor.state.doc.childCount).toBe(1)
    expect(editor.state.doc.firstChild?.textContent).toBe(imports)
    expect(editor.storage.markdown.getMarkdown().trim()).toBe(imports)
  })

  it('uses JSX syntax highlighting for MDX import blocks', () => {
    const editor = createEditor("import Callout from '@/components/Callout'")

    expect(editor.view.dom.querySelector('.hljs-keyword')?.textContent).toBe(
      'import'
    )
  })

  it('uses XML syntax highlighting for MDX component prop names', () => {
    const editor = createEditor('<Callout className="foo" title="Hi" />')

    expect(getHighlightedText(editor, '.hljs-attr')).toEqual([
      'className',
      'title'
    ])
  })

  it('keeps JSX expression internals as XML-mode text in component blocks', () => {
    const { calls, lowlight } = getTrackingLowlight()

    new Editor({
      content:
        '<Callout className="foo" title="Hi" onClick={() => setOpen(true)} />',
      extensions: [
        Markdown.configure({
          html: false,
          linkify: false
        }),
        StarterKit,
        MdxBlock.configure({
          lowlight
        })
      ]
    })

    expect(calls[0]?.language).toBe('xml')
  })

  it('round-trips multiline import statements', () => {
    const imports = `import {
  Callout,
  Tag
} from '@/components/examples'`
    const editor = createEditor(imports)

    expect(editor.state.doc.firstChild?.textContent).toBe(imports)
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

    expect(editor.state.doc.firstChild?.textContent).toBe(mdx)
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
