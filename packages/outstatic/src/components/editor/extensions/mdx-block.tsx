import { mergeAttributes } from '@tiptap/core'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer
} from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import type MarkdownIt from 'markdown-it'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { parse } from 'acorn'
import { AlertCircle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/shadcn/tooltip'

const MDX_BLOCK_TYPE = 'mdxBlock'
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

type MdxValidationResult =
  | {
    valid: true
    message?: never
  }
  | {
    valid: false
    message: string
  }

type MdxTagToken =
  | {
    type: 'open'
    tagName: string
    isFragment: boolean
  }
  | {
    type: 'close'
    tagName: string
    isFragment: boolean
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

type LowlightResult = {
  children?: unknown[]
  value?: string
}

type Lowlight = {
  listLanguages: () => string[]
  registered?: (language: string) => boolean
  highlight: (language: string, value: string) => LowlightResult
  highlightAuto: (value: string) => LowlightResult
}

const plainLowlight = {
  listLanguages: () => [],
  registered: () => false,
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

const getMdxHighlightLanguage = (value: string) => {
  const trimmed = value.trimStart()

  if (/^(?:import|export)\s/.test(trimmed)) {
    return 'jsx'
  }

  if (trimmed.startsWith('<')) {
    return 'xml'
  }

  return 'jsx'
}

export const createMdxLowlight = (baseLowlight: Lowlight): Lowlight => ({
  listLanguages: () =>
    Array.from(new Set([...baseLowlight.listLanguages(), 'mdx'])),
  registered: (language: string) =>
    language === 'mdx' || Boolean(baseLowlight.registered?.(language)),
  highlight: (language: string, value: string) =>
    baseLowlight.highlight(
      language === 'mdx' ? getMdxHighlightLanguage(value) : language,
      value
    ),
  highlightAuto: (value: string) =>
    baseLowlight.highlight(getMdxHighlightLanguage(value), value)
})

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
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

const getClosingTagName = (opening: MdxOpening) =>
  opening.isFragment ? '</>' : `</${opening.tagName}>`

const getClosingTagNameFromToken = (
  token: Extract<MdxTagToken, { type: 'open' }>
) => (token.isFragment ? '</>' : `</${token.tagName}>`)

const findTagEnd = (value: string, start: number) => {
  let quote: '"' | "'" | null = null
  let braceDepth = 0

  for (let index = start + 1; index < value.length; index += 1) {
    const character = value[index]

    if (quote) {
      if (character === quote) {
        quote = null
      }

      continue
    }

    if (character === '"' || character === "'") {
      quote = character
      continue
    }

    if (character === '{') {
      braceDepth += 1
      continue
    }

    if (character === '}') {
      braceDepth = Math.max(0, braceDepth - 1)
      continue
    }

    if (character === '>' && braceDepth === 0) {
      return index
    }
  }

  return -1
}

const getMdxTagTokens = (value: string): MdxTagToken[] => {
  const tokens: MdxTagToken[] = []
  let index = 0

  while (index < value.length) {
    const tagStart = value.indexOf('<', index)

    if (tagStart === -1) {
      break
    }

    const tagEnd = findTagEnd(value, tagStart)

    if (tagEnd === -1) {
      break
    }

    const tag = value.slice(tagStart, tagEnd + 1).trim()
    index = tagEnd + 1

    if (
      tag.startsWith('<!--') ||
      tag.startsWith('<!') ||
      tag.startsWith('<?')
    ) {
      continue
    }

    if (tag === '<>') {
      tokens.push({ type: 'open', tagName: '', isFragment: true })
      continue
    }

    if (tag === '</>') {
      tokens.push({ type: 'close', tagName: '', isFragment: true })
      continue
    }

    const closingMatch = tag.match(
      /^<\/([A-Za-z][\w:-]*(?:\.[A-Za-z][\w:-]*)*)\s*>$/
    )

    if (closingMatch) {
      tokens.push({
        type: 'close',
        tagName: closingMatch[1],
        isFragment: false
      })
      continue
    }

    if (tag.endsWith('/>')) {
      continue
    }

    const opening = getMdxOpening(tag)

    if (opening) {
      tokens.push({
        type: 'open',
        tagName: opening.tagName,
        isFragment: opening.isFragment
      })
    }
  }

  return tokens
}

const isCompleteMdxEsm = (value: string, kind: MdxEsmKind) => {
  try {
    const program = parse(value, {
      ecmaVersion: 'latest',
      sourceType: 'module'
    })

    return (
      program.body.length > 0 &&
      program.body.every((node) =>
        kind === 'import'
          ? node.type === 'ImportDeclaration'
          : node.type.startsWith('Export')
      )
    )
  } catch {
    return false
  }
}

export const validateMdxBlock = (raw: string): MdxValidationResult => {
  const trimmed = raw.trim()

  if (!trimmed) {
    return { valid: true }
  }

  const esmKind = getMdxEsmKind(trimmed)

  if (esmKind) {
    return isCompleteMdxEsm(raw, esmKind)
      ? { valid: true }
      : { valid: false, message: 'Invalid import/export statement.' }
  }

  const opening = getMdxOpening(trimmed)

  if (!opening) {
    return {
      valid: false,
      message: 'MDX blocks must start with import, export, or JSX/HTML.'
    }
  }

  const tokens = getMdxTagTokens(raw)

  if (tokens.length === 0) {
    if (trimmed.endsWith('/>')) {
      return { valid: true }
    }

    return {
      valid: false,
      message: `Missing closing ${getClosingTagName(opening)} tag.`
    }
  }

  const stack: Array<Extract<MdxTagToken, { type: 'open' }>> = []

  for (const token of tokens) {
    if (token.type === 'open') {
      stack.push(token)
      continue
    }

    const expected = stack.pop()

    if (!expected) {
      return {
        valid: false,
        message: `Unexpected closing ${token.isFragment ? '</>' : `</${token.tagName}>`
          } tag.`
      }
    }

    if (
      expected.isFragment !== token.isFragment ||
      expected.tagName !== token.tagName
    ) {
      return {
        valid: false,
        message: `Missing closing ${getClosingTagNameFromToken(expected)} tag.`
      }
    }
  }

  const unclosedTag = stack.pop()

  if (unclosedTag) {
    return {
      valid: false,
      message: `Missing closing ${getClosingTagNameFromToken(unclosedTag)} tag.`
    }
  }

  return { valid: true }
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
    `<pre data-type="${MDX_BLOCK_TYPE}"><code>${escapeHtml(
      tokens[index].content
    )}</code></pre>`
}

const MdxBlockView = ({ node }: NodeViewProps) => {
  const validation = validateMdxBlock(node.textContent)
  const isInvalid = !validation.valid

  return (
    <NodeViewWrapper className="relative">
      {isInvalid ? (
        <div
          contentEditable={false}
          className="absolute top-2 left-3 z-10"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                aria-label={`MDX validation warning: ${validation.message}`}
                className="inline-flex size-6 items-center justify-center rounded-full bg-destructive/15 text-destructive p-0"
                type="button"
              >
                <AlertCircle aria-hidden="true" size={16} />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-72" side="top">
              {validation.message}
            </TooltipContent>
          </Tooltip>
        </div>
      ) : null}
      <div className="absolute top-0 right-6 rounded-b-md border border-t-0 border-gray-600 px-3 py-1">
        <span
          contentEditable={false}
          className="select-none bg-linear-to-tr from-primary-300 to-primary-400 bg-clip-text font-medium text-white outline-hidden text-sm"
        >
          MDX
        </span>
      </div>
      <pre
        className={`text-white bg-foreground dark:bg-background rounded-md p-4 pt-12 border ${isInvalid ? 'border-red-500' : 'border-gray-600'
          }`}
      >
        <NodeViewContent
          as="code"
          aria-invalid={isInvalid}
          aria-label="MDX block content"
        />
      </pre>
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

export const MdxBlock = CodeBlockLowlight.extend({
  name: MDX_BLOCK_TYPE,
  priority: 1000,

  addOptions() {
    return {
      ...this.parent?.(),
      lowlight: plainLowlight,
      defaultLanguage: 'mdx'
    }
  },

  parseHTML() {
    return [
      {
        tag: `pre[data-type="${MDX_BLOCK_TYPE}"]`,
        preserveWhitespace: 'full'
      }
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'pre',
      mergeAttributes(HTMLAttributes, {
        'data-type': MDX_BLOCK_TYPE
      }),
      ['code', 0]
    ]
  },

  addCommands() {
    return {
      setMdxBlock:
        (attributes = {}) =>
          ({ commands }) =>
            commands.insertContent({
              type: this.name,
              content: attributes.raw
                ? [
                  {
                    type: 'text',
                    text: attributes.raw
                  }
                ]
                : []
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
          state.write(node.textContent)
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
