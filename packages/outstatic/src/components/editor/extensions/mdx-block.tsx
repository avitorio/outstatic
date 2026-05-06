import { Node, mergeAttributes } from '@tiptap/core'
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'

const MDX_BLOCK_TYPE = 'mdxBlock'
const MDX_BLOCK_PLACEHOLDER = '<MyComponent />'

type MdxOpening = {
  tagName: string
  isFragment: boolean
}

const escapeAttribute = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

const getLine = (state: any, line: number) => {
  const start = state.bMarks[line]
  const end = state.eMarks[line]

  return state.src.slice(start, end)
}

export const getMdxOpening = (line: string): MdxOpening | null => {
  const trimmed = line.trim()

  if (!trimmed.startsWith('<') || trimmed.startsWith('</')) {
    return null
  }

  if (
    trimmed.startsWith('<!--') ||
    trimmed.startsWith('<!') ||
    trimmed.startsWith('<?')
  ) {
    return null
  }

  if (trimmed.startsWith('<>')) {
    return {
      tagName: '',
      isFragment: true
    }
  }

  const match = trimmed.match(
    /^<([A-Za-z][\w:-]*(?:\.[A-Za-z][\w:-]*)*)(?=[\s>/])/
  )

  if (!match) {
    return null
  }

  return {
    tagName: match[1],
    isFragment: false
  }
}

export const isMdxEsmLine = (line: string) =>
  /^(?:import|export)\s/.test(line.trim())

const countMatches = (value: string, regexp: RegExp) =>
  Array.from(value.matchAll(regexp)).length

const getTagDepthDelta = (line: string, opening: MdxOpening) => {
  if (opening.isFragment) {
    return countMatches(line, /<>/g) - countMatches(line, /<\/>/g)
  }

  const escapedTagName = opening.tagName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const openingRegexp = new RegExp(
    `<${escapedTagName}(?=[\\s>/])(?!(?:[^>"']|"[^"]*"|'[^']*')*\\/>)`,
    'g'
  )
  const closingRegexp = new RegExp(`</${escapedTagName}\\s*>`, 'g')

  return countMatches(line, openingRegexp) - countMatches(line, closingRegexp)
}

const collectMdxEsmBlock = (state: any, startLine: number, endLine: number) => {
  const firstLine = getLine(state, startLine)

  if (!isMdxEsmLine(firstLine)) {
    return null
  }

  const lines = [firstLine]
  let nextLine = startLine + 1

  while (nextLine < endLine) {
    const line = getLine(state, nextLine)

    if (!isMdxEsmLine(line)) {
      break
    }

    lines.push(line)
    nextLine += 1
  }

  return {
    content: lines.join('\n'),
    nextLine
  }
}

const collectMdxBlock = (state: any, startLine: number, endLine: number) => {
  const esmBlock = collectMdxEsmBlock(state, startLine, endLine)

  if (esmBlock) {
    return esmBlock
  }

  const firstLine = getLine(state, startLine)
  const opening = getMdxOpening(firstLine)

  if (!opening) {
    return null
  }

  const lines = [firstLine]
  let depth = getTagDepthDelta(firstLine, opening)
  let nextLine = startLine + 1

  if (depth <= 0) {
    return {
      content: firstLine,
      nextLine
    }
  }

  while (nextLine < endLine) {
    const line = getLine(state, nextLine)
    lines.push(line)
    depth += getTagDepthDelta(line, opening)
    nextLine += 1

    if (depth <= 0) {
      return {
        content: lines.join('\n'),
        nextLine
      }
    }
  }

  return {
    content: firstLine,
    nextLine: startLine + 1
  }
}

export const markdownItMdxBlock = (markdownit: any) => {
  markdownit.block.ruler.before(
    'html_block',
    'mdx_block',
    (state: any, startLine: number, endLine: number, silent: boolean) => {
      const block = collectMdxBlock(state, startLine, endLine)

      if (!block) {
        return false
      }

      if (silent) {
        return true
      }

      const token = state.push('mdx_block', '', 0)
      token.block = true
      token.content = block.content
      token.map = [startLine, block.nextLine]
      state.line = block.nextLine

      return true
    },
    {
      alt: ['paragraph', 'reference', 'blockquote']
    }
  )

  markdownit.renderer.rules.mdx_block = (tokens: any[], index: number) =>
    `<div data-type="${MDX_BLOCK_TYPE}" data-raw="${escapeAttribute(
      tokens[index].content
    )}"></div>`
}

const MdxBlockView = ({ node, updateAttributes }: NodeViewProps) => {
  const raw = node.attrs.raw ?? ''

  return (
    <NodeViewWrapper className="not-prose my-4 rounded-md border border-muted bg-muted/30 p-3">
      <div
        contentEditable={false}
        className="mb-2 text-xs font-medium text-muted-foreground"
      >
        MDX
      </div>
      <textarea
        contentEditable={false}
        spellCheck={false}
        value={raw}
        placeholder={MDX_BLOCK_PLACEHOLDER}
        onChange={(event) => updateAttributes({ raw: event.target.value })}
        className="min-h-24 w-full resize-y rounded-md border border-muted bg-background p-3 font-mono text-sm text-foreground outline-hidden focus:border-primary"
      />
    </NodeViewWrapper>
  )
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mdxBlock: {
      setMdxBlock: (attributes?: { raw?: string }) => ReturnType
    }
  }
}

export const MdxBlock = Node.create({
  name: MDX_BLOCK_TYPE,
  group: 'block',
  atom: true,
  isolating: true,
  selectable: true,

  addAttributes() {
    return {
      raw: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-raw') ?? '',
        renderHTML: (attributes) => ({
          'data-raw': attributes.raw
        })
      }
    }
  },

  parseHTML() {
    return [{ tag: `div[data-type="${MDX_BLOCK_TYPE}"]` }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': MDX_BLOCK_TYPE
      })
    ]
  },

  addCommands() {
    return {
      setMdxBlock:
        (attributes = {}) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              raw: attributes.raw ?? ''
            }
          })
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxBlockView)
  },

  addStorage() {
    return {
      markdown: {
        serialize: (state: any, node: any) => {
          state.write(node.attrs.raw ?? '')
          state.closeBlock(node)
        },
        parse: {
          setup(markdownit: any) {
            markdownit.use(markdownItMdxBlock)
          }
        }
      }
    }
  }
})
