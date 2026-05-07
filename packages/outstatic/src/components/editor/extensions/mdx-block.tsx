import { Node, mergeAttributes } from '@tiptap/core'
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import type MarkdownIt from 'markdown-it'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

const MDX_BLOCK_TYPE = 'mdxBlock'
const MDX_BLOCK_PLACEHOLDER = '<MyComponent />'

type MdxOpening = {
  tagName: string
  isFragment: boolean
}

type MdxEsmKind = 'import' | 'export'

type MarkdownItToken = {
  block: boolean
  content: string
  map: [number, number]
}

type MarkdownItBlockState = {
  src: string
  bMarks: number[]
  eMarks: number[]
  line: number
  push: (type: string, tag: string, nesting: number) => MarkdownItToken
}

type MarkdownSerializerState = {
  write: (content: string) => void
  closeBlock: (node: ProseMirrorNode) => void
}

type MdxBlockMatch = {
  content: string
  nextLine: number
}

type TagMatchers =
  | {
      isFragment: true
    }
  | {
      isFragment: false
      openingRegexp: RegExp
      closingRegexp: RegExp
    }

const escapeAttribute = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\r/g, '&#13;')
    .replace(/\n/g, '&#10;')

const getLine = (state: MarkdownItBlockState, line: number) => {
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

const getMdxEsmKind = (line: string): MdxEsmKind | null => {
  const trimmed = line.trim()

  if (/^import\s/.test(trimmed) && !/^import\s*\(/.test(trimmed)) {
    return 'import'
  }

  if (/^export\s/.test(trimmed)) {
    return 'export'
  }

  return null
}

export const isMdxEsmLine = (line: string) => getMdxEsmKind(line) !== null

const countMatches = (value: string, regexp: RegExp) =>
  Array.from(value.matchAll(regexp)).length

const createTagMatchers = (opening: MdxOpening): TagMatchers => {
  if (opening.isFragment) {
    return { isFragment: true }
  }

  const escapedTagName = opening.tagName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  return {
    isFragment: false,
    openingRegexp: new RegExp(
      `<${escapedTagName}(?=[\\s>/])(?!(?:[^>"']|"[^"]*"|'[^']*')*\\/>)`,
      'g'
    ),
    closingRegexp: new RegExp(`</${escapedTagName}\\s*>`, 'g')
  }
}

const getTagDepthDelta = (line: string, matchers: TagMatchers) => {
  if (matchers.isFragment) {
    return countMatches(line, /<>/g) - countMatches(line, /<\/>/g)
  }

  return (
    countMatches(line, matchers.openingRegexp) -
    countMatches(line, matchers.closingRegexp)
  )
}

const getSyntaxDepth = (value: string) => {
  let braces = 0
  let brackets = 0
  let parens = 0
  let quote: '"' | "'" | '`' | null = null
  let escaped = false
  let blockComment = false
  let lineComment = false

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index]
    const next = value[index + 1]

    if (lineComment) {
      if (char === '\n') {
        lineComment = false
      }
      continue
    }

    if (blockComment) {
      if (char === '*' && next === '/') {
        blockComment = false
        index += 1
      }
      continue
    }

    if (quote) {
      if (escaped) {
        escaped = false
        continue
      }

      if (char === '\\') {
        escaped = true
        continue
      }

      if (char === quote) {
        quote = null
      }
      continue
    }

    if (char === '/' && next === '/') {
      lineComment = true
      index += 1
      continue
    }

    if (char === '/' && next === '*') {
      blockComment = true
      index += 1
      continue
    }

    if (char === '"' || char === "'" || char === '`') {
      quote = char
      continue
    }

    if (char === '{') braces += 1
    if (char === '}') braces -= 1
    if (char === '[') brackets += 1
    if (char === ']') brackets -= 1
    if (char === '(') parens += 1
    if (char === ')') parens -= 1
  }

  return {
    braces,
    brackets,
    parens,
    inString: quote !== null,
    inComment: blockComment
  }
}

const isBalancedJavaScriptSnippet = (value: string) => {
  const depth = getSyntaxDepth(value)

  return (
    depth.braces <= 0 &&
    depth.brackets <= 0 &&
    depth.parens <= 0 &&
    !depth.inString &&
    !depth.inComment
  )
}

const isCompleteMdxEsm = (value: string, kind: MdxEsmKind) => {
  if (!isBalancedJavaScriptSnippet(value)) {
    return false
  }

  const normalized = value.trim().replace(/\s+/g, ' ')

  if (kind === 'import') {
    return (
      /^import\s+['"][^'"]+['"]\s*;?$/.test(normalized) ||
      /^import\s+.+\s+from\s+['"][^'"]+['"]\s*;?$/.test(normalized)
    )
  }

  return /^export\s+(?:(?:type\s+)?(?:const|let|var|function|class|default|async|interface|enum)\b|\{|\*)/.test(
    normalized
  )
}

const collectMdxEsmStatement = (
  state: MarkdownItBlockState,
  startLine: number,
  endLine: number
): MdxBlockMatch | null => {
  const firstLine = getLine(state, startLine)
  const kind = getMdxEsmKind(firstLine)

  if (!kind) {
    return null
  }

  const lines = [firstLine]
  let nextLine = startLine + 1

  if (isCompleteMdxEsm(firstLine, kind)) {
    return {
      content: firstLine,
      nextLine
    }
  }

  while (nextLine < endLine) {
    const line = getLine(state, nextLine)

    if (line.trim() === '') {
      break
    }

    lines.push(line)
    nextLine += 1

    const content = lines.join('\n')

    if (isCompleteMdxEsm(content, kind)) {
      return {
        content,
        nextLine
      }
    }
  }

  return null
}

const collectMdxEsmBlock = (
  state: MarkdownItBlockState,
  startLine: number,
  endLine: number
): MdxBlockMatch | null => {
  const firstStatement = collectMdxEsmStatement(state, startLine, endLine)

  if (!firstStatement) {
    return null
  }

  const lines = firstStatement.content.split('\n')
  let nextLine = firstStatement.nextLine

  while (nextLine < endLine) {
    const line = getLine(state, nextLine)

    if (line.trim() === '' || !getMdxEsmKind(line)) {
      break
    }

    const statement = collectMdxEsmStatement(state, nextLine, endLine)

    if (!statement) {
      break
    }

    lines.push(...statement.content.split('\n'))
    nextLine = statement.nextLine
  }

  return {
    content: lines.join('\n'),
    nextLine
  }
}

const collectMdxBlock = (
  state: MarkdownItBlockState,
  startLine: number,
  endLine: number
): MdxBlockMatch | null => {
  const esmBlock = collectMdxEsmBlock(state, startLine, endLine)

  if (esmBlock) {
    return esmBlock
  }

  const firstLine = getLine(state, startLine)
  const opening = getMdxOpening(firstLine)

  if (!opening) {
    return null
  }

  const matchers = createTagMatchers(opening)
  const lines = [firstLine]
  let depth = getTagDepthDelta(firstLine, matchers)
  let nextLine = startLine + 1

  if (depth <= 0) {
    return {
      content: firstLine,
      nextLine
    }
  }

  while (nextLine < endLine) {
    const line = getLine(state, nextLine)

    if (line.trim() === '') {
      return {
        content: lines.join('\n'),
        nextLine
      }
    }

    lines.push(line)
    depth += getTagDepthDelta(line, matchers)
    nextLine += 1

    if (depth <= 0) {
      return {
        content: lines.join('\n'),
        nextLine
      }
    }
  }

  return {
    content: lines.join('\n'),
    nextLine
  }
}

const markdownItMdxBlock = (markdownit: MarkdownIt) => {
  markdownit.block.ruler.before(
    'html_block',
    'mdx_block',
    (state: unknown, startLine: number, endLine: number, silent: boolean) => {
      const blockState = state as MarkdownItBlockState
      const block = collectMdxBlock(blockState, startLine, endLine)

      if (!block) {
        return false
      }

      if (silent) {
        return true
      }

      const token = blockState.push('mdx_block', '', 0)
      token.block = true
      token.content = block.content
      token.map = [startLine, block.nextLine]
      blockState.line = block.nextLine

      return true
    },
    {
      alt: ['paragraph', 'reference', 'blockquote']
    }
  )

  markdownit.renderer.rules.mdx_block = (tokens, index) =>
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
        aria-label="MDX block content"
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
        serialize: (state: MarkdownSerializerState, node: ProseMirrorNode) => {
          state.write(node.attrs.raw ?? '')
          state.closeBlock(node)
        },
        parse: {
          setup(markdownit: MarkdownIt) {
            markdownit.use(markdownItMdxBlock)
          }
        }
      }
    }
  }
})
