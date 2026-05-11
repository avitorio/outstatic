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

export const plainLowlight = {
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
