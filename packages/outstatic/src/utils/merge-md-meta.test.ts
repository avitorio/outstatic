import { mergeMdMeta } from './merge-md-meta'
import matter from 'gray-matter'

describe('mergeMdMeta', () => {
  it('writes select field values as scalar strings in frontmatter', () => {
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

    expect(matter(merged).data.category).toBe('news')
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

    expect(matter(merged).data.cover).toBe('/assets/video/cover.png')
    expect(merged).toContain('![Clip](/assets/video/clip.mp4)')
    expect(merged).not.toContain('/assets/clip.mp4')
  })

  it('writes array fields as a block sequence on a new line', () => {
    const tags = [
      { label: 'News', value: 'news' },
      { label: 'Tech', value: 'tech' }
    ]

    const merged = mergeMdMeta({
      data: {
        title: 'Tagged post',
        content: 'Body',
        tags
      },
      basePath: '',
      repoOwner: 'owner',
      repoSlug: 'repo',
      repoBranch: 'main',
      publicMediaPath: 'uploads/'
    })

    expect(merged).toContain(
      ['tags:', '  - label: News', '    value: news'].join('\n')
    )

    expect(matter(merged).data.tags).toEqual(tags)
  })

  it('writes scalar array fields as a block sequence on a new line', () => {
    const merged = mergeMdMeta({
      data: {
        title: 'Tagged post',
        content: 'Body',
        keywords: ['one', 'two']
      },
      basePath: '',
      repoOwner: 'owner',
      repoSlug: 'repo',
      repoBranch: 'main',
      publicMediaPath: 'uploads/'
    })

    expect(matter(merged).data.keywords).toEqual(['one', 'two'])
  })

  it('writes multiline markdown frontmatter as a YAML block scalar', () => {
    const summary = '## Intro\n\nRich copy\n\n- one\n- two'

    const merged = mergeMdMeta({
      data: {
        title: 'Rich text frontmatter',
        content: 'Body content',
        summary
      },
      basePath: '',
      repoOwner: 'owner',
      repoSlug: 'repo',
      repoBranch: 'main',
      publicMediaPath: 'uploads/'
    })

    expect(merged).toContain(
      [
        'summary: |-',
        '  ## Intro',
        '',
        '  Rich copy',
        '',
        '  - one',
        '  - two'
      ].join('\n')
    )

    expect(matter(merged).data.summary).toBe(summary)
  })

  it('round-trips frontmatter values through gray-matter without type drift', () => {
    const publishedAt = new Date('2024-06-15T12:34:56.000Z')

    const merged = mergeMdMeta({
      data: {
        title: 'Round trip',
        content: 'Body',
        publishedAt,
        draft: false,
        views: 42,
        missing: null,
        zip: '01234',
        flag: 'no',
        author: { name: 'Ada', handle: '@ada' },
        keywords: ['one', 'two'],
        summary: 'line one\nline two'
      },
      basePath: '',
      repoOwner: 'owner',
      repoSlug: 'repo',
      repoBranch: 'main',
      publicMediaPath: 'uploads/'
    })

    const parsed = matter(merged).data

    expect(parsed.title).toBe('Round trip')
    expect(parsed.publishedAt).toEqual(publishedAt)
    expect(parsed.draft).toBe(false)
    expect(parsed.views).toBe(42)
    expect(parsed.missing).toBeNull()
    expect(parsed.zip).toBe('01234')
    expect(parsed.flag).toBe('no')
    expect(parsed.author).toEqual({ name: 'Ada', handle: '@ada' })
    expect(parsed.keywords).toEqual(['one', 'two'])
    expect(parsed.summary).toBe('line one\nline two')
  })
})
