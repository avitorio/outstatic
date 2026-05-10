import type MarkdownIt from 'markdown-it'
import {
  MDX_BLOCK_TYPE,
  getMdxEsmKind,
  getMdxOpening,
  type MdxOpening
} from './mdx-block-utils'
import { isCompleteMdxEsm } from './mdx-validation'

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

export const markdownItMdxBlock = (markdownit: MarkdownIt) => {
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
