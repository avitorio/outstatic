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

const readTagName = (value: string, start: number) => {
  const match = value
    .slice(start)
    .match(/^([A-Za-z][\w:-]*(?:\.[A-Za-z][\w:-]*)*)/)

  return match?.[1] ?? null
}

const findTagEnd = (value: string, start: number) => {
  let quote: '"' | "'" | '`' | null = null
  let braceDepth = 0

  for (let index = start + 1; index < value.length; index += 1) {
    const character = value[index]

    if (quote) {
      if (character === '\\') {
        index += 1
        continue
      }

      if (character === quote) {
        quote = null
      }

      continue
    }

    if (character === '"' || character === "'" || character === '`') {
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

const isSelfClosingTag = (value: string, tagEnd: number) => {
  let index = tagEnd - 1

  while (index >= 0 && /\s/.test(value[index])) {
    index -= 1
  }

  return value[index] === '/'
}

const getTagDepth = (value: string, opening: MdxOpening) => {
  let depth = 0
  let index = 0

  while (index < value.length) {
    const tagStart = value.indexOf('<', index)

    if (tagStart === -1) {
      break
    }

    const nextCharacter = value[tagStart + 1]

    if (value.startsWith('<!--', tagStart)) {
      const commentEnd = value.indexOf('-->', tagStart + 4)
      index = commentEnd === -1 ? value.length : commentEnd + 3
      continue
    }

    if (nextCharacter === '!' || nextCharacter === '?') {
      const tagEnd = findTagEnd(value, tagStart)
      index = tagEnd === -1 ? value.length : tagEnd + 1
      continue
    }

    if (opening.isFragment) {
      if (value.startsWith('</>', tagStart)) {
        depth -= 1
        index = tagStart + 3
        continue
      }

      if (value.startsWith('<>', tagStart)) {
        depth += 1
        index = tagStart + 2
        continue
      }

      const tagName = readTagName(value, tagStart + 1)

      if (tagName) {
        const tagEnd = findTagEnd(value, tagStart)
        index = tagEnd === -1 ? value.length : tagEnd + 1
        continue
      }

      index = tagStart + 1
      continue
    }

    const isClosingTag = nextCharacter === '/'
    const tagNameStart = tagStart + (isClosingTag ? 2 : 1)
    const tagName = readTagName(value, tagNameStart)

    if (!tagName) {
      index = tagStart + 1
      continue
    }

    const tagEnd = findTagEnd(value, tagStart)

    if (tagEnd === -1) {
      if (!isClosingTag && tagName === opening.tagName) {
        depth += 1
      }

      break
    }

    if (tagName !== opening.tagName) {
      index = tagEnd + 1
      continue
    }

    if (isClosingTag) {
      depth -= 1
    } else if (!isSelfClosingTag(value, tagEnd)) {
      depth += 1
    }

    index = tagEnd + 1
  }

  return depth
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

  const lines = [firstLine]
  let depth = getTagDepth(firstLine, opening)
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
    depth = getTagDepth(lines.join('\n'), opening)
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
