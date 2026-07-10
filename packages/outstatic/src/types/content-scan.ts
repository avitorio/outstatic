export type InferredField = {
  name: string
  title: string
  fieldType: 'String' | 'Text' | 'Number' | 'Boolean' | 'Date' | 'Image' | 'Array'
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'image' | 'array'
  required: false
  itemType?: 'String'
}

export type ContentSuggestion = {
  id: string
  title: string
  slug: string
  path: string
  docCount: number
  extensions: Array<'md' | 'mdx'>
  sampleFiles: string[]
  fields: InferredField[]
  tier: 1 | 2 | 3
  framework?: 'astro' | 'jekyll' | 'hugo' | 'nextra' | 'convention' | 'legacy'
  confidence: number
  warnings: string[]
  preselected: boolean
}

export type ContentScanResult = {
  headSha: string
  branch: string
  truncated: boolean
  existingOutstatic: {
    contentPath: string
    matchesProjectConfig: boolean
  } | null
  suggestions: ContentSuggestion[]
  singletons: ContentSuggestion[]
  warnings: string[]
  stats: { markdownFiles: number; scannedFiles: number }
}
