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
      repoOwner: 'owner',
      repoSlug: 'repo',
      repoBranch: 'main',
      publicMediaPath: 'uploads/'
    })

    expect(merged).toContain('category: news')
    expect(merged).not.toContain('label: News')
  })

  it('prefers the most specific media source when rewriting overlapping API paths', () => {
    const merged = mergeMdMeta({
      data: {
        title: 'Video entry',
        content:
          '![Clip](/api/api/outstatic/media/owner/repo/main/public/assets/video/clip.mp4)',
        cover:
          '/api/api/outstatic/media/owner/repo/main/public/assets/video/cover.png'
      },
      basePath: '/api',
      repoOwner: 'owner',
      repoSlug: 'repo',
      repoBranch: 'main',
      media: [
        {
          name: 'assets',
          label: 'Assets',
          input: 'public/assets',
          output: '/assets',
          categories: ['image']
        },
        {
          name: 'videos',
          label: 'Videos',
          input: 'public/assets/video',
          output: '/assets/video',
          categories: ['video']
        }
      ]
    })

    expect(merged).toContain('cover: /assets/video/cover.png')
    expect(merged).toContain('![Clip](/assets/video/clip.mp4)')
    expect(merged).not.toContain('/assets/clip.mp4')
  })
})
