import matter from 'gray-matter'

export type DocsMenuItem = {
  title: string
  href?: string
  items: DocsMenuItem[]
}

const LINK_PATTERN = /^\[([^\]]+)\]\(([^)]+)\)$/

const parseMenuLine = (rawLine: string): { depth: number; value: string } | null => {
  const lineMatch = rawLine.match(/^(\s*)-\s+(.*)$/)

  if (!lineMatch) {
    return null
  }

  const indentation = lineMatch[1].replace(/\t/g, '  ').length
  const depth = Math.floor(indentation / 2)
  const value = lineMatch[2].trim()

  if (!value) {
    return null
  }

  return { depth, value }
}

const parseMenuValue = (value: string): DocsMenuItem => {
  const linkMatch = value.match(LINK_PATTERN)

  if (!linkMatch) {
    return {
      title: value.replace(/:$/, '').trim(),
      items: []
    }
  }

  return {
    title: linkMatch[1].trim(),
    href: linkMatch[2].trim(),
    items: []
  }
}

export function parseMenuMarkdown(rawContent: string): DocsMenuItem[] {
  if (!rawContent) {
    return []
  }

  const { content } = matter(rawContent)
  const root: DocsMenuItem[] = []
  const stack: Array<{ depth: number; item: DocsMenuItem }> = []

  for (const rawLine of content.split('\n')) {
    const parsedLine = parseMenuLine(rawLine)

    if (!parsedLine) {
      continue
    }

    const item = parseMenuValue(parsedLine.value)

    while (stack.length > 0 && stack[stack.length - 1].depth >= parsedLine.depth) {
      stack.pop()
    }

    if (stack.length === 0) {
      root.push(item)
    } else {
      stack[stack.length - 1].item.items.push(item)
    }

    stack.push({ depth: parsedLine.depth, item })
  }

  return root
}
