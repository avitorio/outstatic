import type { ContentSuggestion } from '@/types/content-scan'
import { composeImportFiles } from './import-content'

const suggestion = (
  overrides: Partial<ContentSuggestion> = {}
): ContentSuggestion => ({
  id: 'posts',
  title: 'Posts',
  slug: 'posts',
  path: 'content/posts',
  docCount: 1,
  extensions: ['md'],
  sampleFiles: ['content/posts/first.md'],
  fields: [],
  tier: 2,
  confidence: 1,
  warnings: [],
  preselected: true,
  ...overrides
})

describe('composeImportFiles', () => {
  const options = {
    existingCollections: [],
    existingSingletons: [],
    ostContent: 'outstatic/content'
  }

  it('marks configuration-only output as having no schema changes', () => {
    const result = composeImportFiles({
      ...options,
      selections: [],
      singletons: []
    })

    expect(result.hasSchemaChanges).toBe(false)
    expect(result.files).toEqual([
      { path: 'outstatic/content/collections.json', content: '[]\n' },
      { path: 'outstatic/content/singletons.json', content: '[]\n' }
    ])
  })

  it('skips an existing collection matched by slug or path', () => {
    const result = composeImportFiles({
      ...options,
      selections: [suggestion()],
      singletons: [],
      existingCollections: [
        {
          title: 'Existing posts',
          slug: 'posts',
          path: 'content/old-posts',
          parent: null
        }
      ]
    })

    expect(result.hasSchemaChanges).toBe(false)
    expect(result.skipped).toEqual(['content/posts'])
  })

  it('skips singleton suggestions without a source file', () => {
    const result = composeImportFiles({
      ...options,
      selections: [],
      singletons: [
        suggestion({ slug: 'about', path: 'about.md', sampleFiles: [] })
      ]
    })

    expect(result.hasSchemaChanges).toBe(false)
    expect(result.skipped).toEqual(['about.md'])
  })

  it('assigns nested imports to their nearest collection parent', () => {
    const result = composeImportFiles({
      ...options,
      selections: [
        suggestion({ slug: 'docs', path: 'content/docs' }),
        suggestion({ slug: 'guides', path: 'content/docs/guides' })
      ],
      singletons: []
    })
    const collections = JSON.parse(
      result.files.find((file) => file.path.endsWith('collections.json'))!
        .content
    )

    expect(result.hasSchemaChanges).toBe(true)
    expect(collections).toEqual([
      { title: 'Posts', slug: 'docs', path: 'content/docs', parent: null },
      {
        title: 'Posts',
        slug: 'guides',
        path: 'content/docs/guides',
        parent: 'docs'
      }
    ])
  })

  it('assigns nested parents independently of suggestion order', () => {
    const result = composeImportFiles({
      ...options,
      selections: [
        suggestion({ slug: 'guides', path: 'content/docs/guides' }),
        suggestion({ slug: 'docs', path: 'content/docs' })
      ],
      singletons: []
    })
    const collections = JSON.parse(
      result.files.find((file) => file.path.endsWith('collections.json'))!
        .content
    )

    expect(collections).toEqual([
      {
        title: 'Posts',
        slug: 'guides',
        path: 'content/docs/guides',
        parent: 'docs'
      },
      { title: 'Posts', slug: 'docs', path: 'content/docs', parent: null }
    ])
  })
})
