import { mergeMdMeta } from './merge-md-meta'

jest.mock('@catalystic/json-to-yaml', () => ({
  convert: (data: Record<string, unknown>) =>
    Object.entries(data)
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join('\n')
}))

describe('mergeMdMeta', () => {
  it('writes select field values as raw YAML strings in frontmatter', () => {
    const merged = mergeMdMeta({
      data: {
        title: 'Select field example',
        publishedAt: new Date('2024-01-01T00:00:00.000Z'),
        content: 'Hello world',
        status: 'draft',
        slug: 'select-field-example',
        author: {},
        category: 'news'
      },
      basePath: '',
      repoInfo: 'owner/repo/main',
      publicMediaPath: 'uploads/'
    })

    expect(merged).toContain('category: news')
    expect(merged).not.toContain('label: News')
  })
})
