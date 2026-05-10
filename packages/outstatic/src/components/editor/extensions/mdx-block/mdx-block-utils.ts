export const MDX_BLOCK_TYPE = 'mdxBlock'

export type MdxOpening = {
  tagName: string
  isFragment: boolean
}

export type MdxEsmKind = 'import' | 'export'

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
