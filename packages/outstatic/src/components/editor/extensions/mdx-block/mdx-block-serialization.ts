import type { Editor } from '@tiptap/react'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { Block } from '@/utils/metadata/types'
import { buildBlockJsx } from '../slash-command/block-jsx'

type LeadingImportSplit = {
  content: string
  imports: string[]
}

export const getSerializedMdxBlock = (node: ProseMirrorNode) => {
  const { outstaticBlockDefinition, outstaticBlockValues } = node.attrs

  if (!outstaticBlockDefinition || !outstaticBlockValues) {
    return null
  }

  try {
    return buildBlockJsx(
      JSON.parse(outstaticBlockDefinition) as Block,
      JSON.parse(outstaticBlockValues)
    )
  } catch {
    return null
  }
}

const normalizeLineEndings = (value: string) => value.replace(/\r\n?/g, '\n')

const isImportStatementStart = (value: string, index: number) => {
  if (!value.startsWith('import', index)) {
    return false
  }

  const nextCharacter = value[index + 'import'.length]

  return (
    nextCharacter === undefined ||
    /\s/.test(nextCharacter) ||
    nextCharacter === '{' ||
    nextCharacter === '*' ||
    nextCharacter === '"' ||
    nextCharacter === "'"
  )
}

const isLikelyImportStatement = (value: string) => {
  const statement = value.trim()

  if (statement.length === 0) {
    return false
  }

  return (
    /^import\s+["'][^"']+["'];?$/.test(statement) ||
    /^import[\s\S]+\bfrom\s+["'][^"']+["'](?:\s+with\s*\{[\s\S]*\})?;?$/.test(
      statement
    )
  )
}

const skipBlankLines = (value: string, start: number) => {
  let index = start

  while (index < value.length) {
    const lineStart = index

    while (
      index < value.length &&
      (value[index] === ' ' || value[index] === '\t')
    ) {
      index += 1
    }

    if (value[index] !== '\n') {
      return lineStart
    }

    index += 1
  }

  return index
}

const readImportStatement = (value: string, start: number) => {
  if (!isImportStatementStart(value, start)) {
    return null
  }

  let index = start
  let quote: '"' | "'" | '`' | null = null
  let braceDepth = 0
  let lineStart = start

  while (index < value.length) {
    const character = value[index]

    if (quote) {
      if (character === '\\') {
        index += 2
        continue
      }

      if (character === quote) {
        quote = null
      }

      index += 1
      continue
    }

    if (character === '"' || character === "'" || character === '`') {
      quote = character
      index += 1
      continue
    }

    if (character === '{') {
      braceDepth += 1
      index += 1
      continue
    }

    if (character === '}') {
      braceDepth = Math.max(0, braceDepth - 1)
      index += 1
      continue
    }

    if (character === '\n') {
      const line = value.slice(lineStart, index).trim()
      const shouldContinue =
        braceDepth > 0 || line.endsWith(',') || /\b(?:from|with)$/.test(line)

      if (!shouldContinue) {
        const statement = value.slice(start, index).trim()
        return isLikelyImportStatement(statement)
          ? {
              nextIndex: index + 1,
              statement
            }
          : null
      }

      lineStart = index + 1
    }

    index += 1
  }

  const statement = value.slice(start).trim()

  return isLikelyImportStatement(statement)
    ? {
        nextIndex: value.length,
        statement
      }
    : null
}

export const dedupeImportStatements = (imports: string[]) => {
  const seen = new Set<string>()
  return imports.reduce<string[]>((ordered, statement) => {
    const normalized = statement.trim()

    if (normalized.length === 0 || seen.has(normalized)) {
      return ordered
    }

    seen.add(normalized)
    ordered.push(normalized)

    return ordered
  }, [])
}

const splitImportStatements = (value: string) => {
  const normalized = normalizeLineEndings(value)
  const imports: string[] = []
  let cursor = 0

  while (cursor < normalized.length) {
    const statement = readImportStatement(normalized, cursor)

    if (!statement) {
      break
    }

    imports.push(statement.statement)
    cursor = skipBlankLines(normalized, statement.nextIndex)
  }

  return {
    content: normalized.slice(cursor),
    imports: dedupeImportStatements(imports)
  }
}

export const splitLeadingImportStatements = (
  value: string
): LeadingImportSplit => {
  const normalized = normalizeLineEndings(value)
  const { content, imports } = splitImportStatements(normalized)

  if (imports.length === 0) {
    return {
      content: normalized,
      imports
    }
  }

  return {
    content,
    imports
  }
}

export const collectBlockImports = (editor: Editor): string[] => {
  const collected: string[] = []

  editor.state.doc.descendants((node) => {
    const definition = node.attrs?.outstaticBlockDefinition
    if (!definition) return

    let block: Block | null = null
    try {
      block = JSON.parse(definition) as Block
    } catch {
      return
    }

    if (!block?.imports) return

    const { imports } = splitImportStatements(block.imports)

    if (imports.length > 0) {
      collected.push(...imports)
      return
    }

    const trimmedImports = block.imports.trim()

    if (trimmedImports.length > 0) {
      collected.push(trimmedImports)
    }
  })

  return dedupeImportStatements(collected)
}
