import { parse } from 'acorn'
import {
  getMdxEsmKind,
  getMdxOpening,
  type MdxEsmKind,
  type MdxOpening
} from './mdx-block-utils'

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

const getClosingTagName = (opening: MdxOpening) =>
  opening.isFragment ? '</>' : `</${opening.tagName}>`

const getClosingTagNameFromToken = (
  token: Extract<MdxTagToken, { type: 'open' }>
) => (token.isFragment ? '</>' : `</${token.tagName}>`)

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

export const isCompleteMdxEsm = (value: string, kind: MdxEsmKind) => {
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
        message: `Unexpected closing ${
          token.isFragment ? '</>' : `</${token.tagName}>`
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
