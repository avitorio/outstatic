import type { Editor } from '@tiptap/core'
import { Block, BlockProp } from '@/utils/metadata/types'
import {
  MDX_BLOCK_TYPE,
  findTagEnd,
  getMdxOpening
} from '../mdx-block/mdx-block-utils'
import { OUTSTATIC_MDX_BLOCK_TYPE } from '../mdx-block'
import { BlockFormValues, getInitialBlockValues } from './block-jsx'

type ParsedAttribute =
  | {
      kind: 'boolean'
    }
  | {
      kind: 'quoted' | 'expression'
      value: string
    }

type ParsedMdxBlock = {
  attrs: Map<string, ParsedAttribute>
  children: string | null
  name: string
}

export type BlockMdxAttributes = {
  outstaticBlockDefinition: string
  outstaticBlockName: string
  outstaticBlockValues: string
}

const decodeAttributeValue = (value: string) =>
  value
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')

const isSelfClosingTag = (value: string, tagEnd: number) => {
  let index = tagEnd - 1

  while (index >= 0 && /\s/.test(value[index])) {
    index -= 1
  }

  return value[index] === '/'
}

const readAttributeName = (source: string, start: number) => {
  const match = source.slice(start).match(/^([A-Za-z_$][\w$:-]*)/)

  if (!match) {
    return null
  }

  return {
    name: match[1],
    nextIndex: start + match[1].length
  }
}

const readQuotedValue = (source: string, start: number) => {
  const quote = source[start]
  let index = start + 1

  while (index < source.length) {
    if (source[index] === '\\') {
      index += 2
      continue
    }

    if (source[index] === quote) {
      return {
        value: source.slice(start + 1, index),
        nextIndex: index + 1
      }
    }

    index += 1
  }

  return {
    value: source.slice(start + 1),
    nextIndex: source.length
  }
}

const readExpressionValue = (source: string, start: number) => {
  let depth = 0
  let quote: '"' | "'" | '`' | null = null

  for (let index = start; index < source.length; index += 1) {
    const character = source[index]

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
      depth += 1
      continue
    }

    if (character === '}') {
      depth -= 1

      if (depth === 0) {
        return {
          value: source.slice(start + 1, index),
          nextIndex: index + 1
        }
      }
    }
  }

  return null
}

const readAttributes = (source: string) => {
  const attrs = new Map<string, ParsedAttribute>()
  let index = 0

  while (index < source.length) {
    while (index < source.length && /\s/.test(source[index])) {
      index += 1
    }

    if (index >= source.length || source[index] === '/') {
      break
    }

    const attr = readAttributeName(source, index)

    if (!attr) {
      index += 1
      continue
    }

    index = attr.nextIndex

    while (index < source.length && /\s/.test(source[index])) {
      index += 1
    }

    if (source[index] !== '=') {
      attrs.set(attr.name, { kind: 'boolean' })
      continue
    }

    index += 1

    while (index < source.length && /\s/.test(source[index])) {
      index += 1
    }

    if (source[index] === '"' || source[index] === "'") {
      const value = readQuotedValue(source, index)
      attrs.set(attr.name, {
        kind: 'quoted',
        value: decodeAttributeValue(value.value)
      })
      index = value.nextIndex
      continue
    }

    if (source[index] === '{') {
      const value = readExpressionValue(source, index)

      if (!value) {
        break
      }

      attrs.set(attr.name, {
        kind: 'expression',
        value: value.value.trim()
      })
      index = value.nextIndex
      continue
    }

    const valueStart = index

    while (index < source.length && !/\s/.test(source[index])) {
      index += 1
    }

    attrs.set(attr.name, {
      kind: 'quoted',
      value: decodeAttributeValue(source.slice(valueStart, index))
    })
  }

  return attrs
}

const normalizeChildren = (value: string) =>
  value.replace(/^\n/, '').replace(/\n$/, '')

const parseMdxBlock = (raw: string): ParsedMdxBlock | null => {
  const value = raw.trim()
  const opening = getMdxOpening(value)

  if (!opening || opening.isFragment) {
    return null
  }

  const tagEnd = findTagEnd(value, 0)

  if (tagEnd === -1) {
    return null
  }

  const attrSource = value.slice(opening.tagName.length + 1, tagEnd)
  const selfClosing = isSelfClosingTag(value, tagEnd)
  const closingTag = `</${opening.tagName}>`
  const closingTagStart = selfClosing ? -1 : value.lastIndexOf(closingTag)

  return {
    name: opening.tagName,
    attrs: readAttributes(attrSource),
    children:
      !selfClosing && closingTagStart > tagEnd
        ? normalizeChildren(value.slice(tagEnd + 1, closingTagStart))
        : null
  }
}

const getTextExpressionValue = (value: string) => {
  try {
    const parsed = JSON.parse(value)
    return typeof parsed === 'string' ? parsed : null
  } catch {
    return null
  }
}

const getBooleanValue = (attr: ParsedAttribute) => {
  if (attr.kind === 'boolean') {
    return true
  }

  const value = attr.value.trim()

  if (value === 'true') {
    return true
  }

  if (value === 'false') {
    return false
  }

  return null
}

const getPropValue = (
  prop: BlockProp,
  attr: ParsedAttribute
): string | boolean | null => {
  if (prop.type === 'Boolean') {
    return getBooleanValue(attr)
  }

  if (attr.kind === 'boolean') {
    return null
  }

  if (prop.type === 'Text' && attr.kind === 'expression') {
    return getTextExpressionValue(attr.value)
  }

  if (prop.type === 'Number' && attr.kind === 'expression') {
    return Number.isFinite(Number(attr.value)) ? attr.value : null
  }

  if (attr.kind === 'quoted') {
    return attr.value
  }

  return getTextExpressionValue(attr.value)
}

const getBlockValuesFromMdx = (
  block: Block,
  parsed: ParsedMdxBlock
): BlockFormValues | null => {
  const values = getInitialBlockValues(block)
  const attributeProps = new Set(
    block.props
      .filter((prop) => prop.type !== 'Children')
      .map((prop) => prop.name)
  )

  for (const attrName of parsed.attrs.keys()) {
    if (!attributeProps.has(attrName)) {
      return null
    }
  }

  for (const prop of block.props) {
    if (prop.type === 'Children') {
      if (parsed.children !== null) {
        values[prop.name] = parsed.children
      }
      continue
    }

    const attr = parsed.attrs.get(prop.name)

    if (!attr) {
      continue
    }

    const value = getPropValue(prop, attr)

    if (value === null) {
      return null
    }

    values[prop.name] = value
  }

  return values
}

export const getBlockMdxAttributes = (
  raw: string,
  blocks: Block[]
): BlockMdxAttributes | null => {
  const parsed = parseMdxBlock(raw)

  if (!parsed) {
    return null
  }

  const block = blocks.find((candidate) => candidate.name === parsed.name)

  if (!block) {
    return null
  }

  const values = getBlockValuesFromMdx(block, parsed)

  if (!values) {
    return null
  }

  return {
    outstaticBlockName: block.name,
    outstaticBlockValues: JSON.stringify(values),
    outstaticBlockDefinition: JSON.stringify(block)
  }
}

export const annotateMdxBlocksWithLibraryMetadata = (
  editor: Editor,
  blocks: Block[]
) => {
  if (blocks.length === 0 || !editor.state?.doc?.descendants || !editor.view) {
    return false
  }

  const { tr } = editor.state
  let changed = false

  editor.state.doc.descendants((node, position) => {
    if (
      node.type.name !== MDX_BLOCK_TYPE ||
      node.attrs.outstaticBlockName ||
      typeof node.textContent !== 'string'
    ) {
      return
    }

    const attrs = getBlockMdxAttributes(node.textContent, blocks)

    if (!attrs) {
      return
    }

    const mappedPosition = tr.mapping.map(position)
    const mappedEnd = tr.mapping.map(position + node.nodeSize)

    const outstaticBlockType =
      editor.state.schema.nodes[OUTSTATIC_MDX_BLOCK_TYPE]

    if (!outstaticBlockType) {
      return
    }

    const replacement = outstaticBlockType.create({
      ...node.attrs,
      ...attrs
    })

    tr.replaceWith(mappedPosition, mappedEnd, replacement)

    const paragraph = editor.state.schema.nodes.paragraph?.create()
    const insertPosition = mappedPosition + replacement.nodeSize

    if (paragraph && insertPosition >= tr.doc.content.size) {
      tr.insert(insertPosition, paragraph)
    }

    changed = true
  })

  if (changed) {
    tr.setMeta('preventUpdate', true)
    tr.setMeta('addToHistory', false)
    editor.view.dispatch(tr)
  }

  return changed
}
