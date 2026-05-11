export const MDX_BLOCK_TYPE = 'mdxBlock'

export type MdxOpening = {
  tagName: string
  isFragment: boolean
}

export type MdxEsmKind = 'import' | 'export'

export const findTagEnd = (value: string, start: number) => {
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

export const getMdxEsmKind = (line: string): MdxEsmKind | null => {
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
