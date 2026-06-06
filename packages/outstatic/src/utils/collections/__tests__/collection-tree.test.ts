import {
  buildParentChildRoutes,
  findCollectionParent,
  getCollectionsAfterDeletion,
  getDescendantCollectionSlugs,
  getInvalidParentCollectionSlugs,
  getMetadataAfterCollectionDeletion,
  getValidParentCollectionOptions,
  normalizeCollectionPath,
  normalizeCollections,
  updateCollectionParent,
  type CollectionType
} from '../collection-tree'

const collection = (
  slug: string,
  path: string,
  parent: string | null = null,
  title = slug
): CollectionType => ({
  title,
  slug,
  path,
  parent
})

describe('normalizeCollectionPath', () => {
  it('strips leading and trailing slashes', () => {
    expect(normalizeCollectionPath('/outstatic/content/posts/')).toBe(
      'outstatic/content/posts'
    )
  })

  it('returns an empty string for slash-only paths', () => {
    expect(normalizeCollectionPath('///')).toBe('')
  })

  it('leaves already-normalized paths unchanged', () => {
    expect(normalizeCollectionPath('outstatic/content/posts/guides')).toBe(
      'outstatic/content/posts/guides'
    )
  })
})

describe('findCollectionParent', () => {
  const collections = [
    collection('posts', 'outstatic/content/posts'),
    collection('guides', 'outstatic/content/posts/guides', 'posts'),
    collection('projects', 'outstatic/content/projects')
  ]

  it('returns null when no collection path is a prefix', () => {
    expect(
      findCollectionParent(collections, 'outstatic/content/news')
    ).toBeNull()
  })

  it('returns the longest matching prefix parent', () => {
    expect(
      findCollectionParent(
        collections,
        'outstatic/content/posts/guides/chapters'
      )
    ).toBe('guides')
  })

  it('ignores the collection itself and empty paths', () => {
    expect(
      findCollectionParent(
        [...collections, collection('empty', '', null)],
        'outstatic/content/posts/new-post'
      )
    ).toBe('posts')
  })

  it('normalizes slash-padded paths before matching', () => {
    expect(
      findCollectionParent(collections, '/outstatic/content/posts/guides/')
    ).toBe('posts')
  })
})

describe('getInvalidParentCollectionSlugs', () => {
  const collections = [
    collection('posts', 'outstatic/content/posts'),
    collection('guides', 'outstatic/content/posts/guides', 'posts'),
    collection('chapters', 'outstatic/content/posts/guides/chapters', 'guides'),
    collection('projects', 'outstatic/content/projects')
  ]

  it('includes the collection and all descendants', () => {
    expect(getInvalidParentCollectionSlugs(collections, 'posts')).toEqual(
      new Set(['posts', 'guides', 'chapters'])
    )
  })
})

describe('getValidParentCollectionOptions', () => {
  const collections = [
    collection('posts', 'outstatic/content/posts'),
    collection('guides', 'outstatic/content/posts/guides', 'posts'),
    collection('chapters', 'outstatic/content/posts/guides/chapters', 'guides'),
    collection('projects', 'outstatic/content/projects')
  ]

  it('excludes the collection and its descendants', () => {
    expect(
      getValidParentCollectionOptions(collections, 'guides').map(
        (collectionInfo) => collectionInfo.slug
      )
    ).toEqual(['posts', 'projects'])
  })
})

describe('updateCollectionParent', () => {
  const collections = [
    collection('posts', 'outstatic/content/posts'),
    collection('guides', 'outstatic/content/posts/guides', 'posts')
  ]

  it('updates the parent slug for the target collection', () => {
    expect(updateCollectionParent(collections, 'guides', null)).toEqual([
      collection('posts', 'outstatic/content/posts'),
      collection('guides', 'outstatic/content/posts/guides', null)
    ])
  })
})

describe('getDescendantCollectionSlugs', () => {
  const collections = [
    collection('posts', 'outstatic/content/posts'),
    collection('guides', 'outstatic/content/posts/guides', 'posts'),
    collection('chapters', 'outstatic/content/posts/guides/chapters', 'guides'),
    collection('projects', 'outstatic/content/projects')
  ]

  it('returns an empty set when there are no descendants', () => {
    expect(getDescendantCollectionSlugs(collections, 'projects')).toEqual(
      new Set()
    )
  })

  it('collects direct and nested descendants', () => {
    expect(getDescendantCollectionSlugs(collections, 'posts')).toEqual(
      new Set(['guides', 'chapters'])
    )
  })

  it('collects descendants from an intermediate node', () => {
    expect(getDescendantCollectionSlugs(collections, 'guides')).toEqual(
      new Set(['chapters'])
    )
  })
})

describe('normalizeCollections', () => {
  it('flattens nested children and assigns parent slugs', () => {
    expect(
      normalizeCollections([
        {
          title: 'Posts',
          slug: 'posts',
          path: 'outstatic/content/posts',
          children: [
            {
              title: 'Guides',
              slug: 'guides',
              path: 'outstatic/content/posts/guides',
              children: []
            }
          ]
        }
      ])
    ).toEqual([
      collection('posts', 'outstatic/content/posts', null, 'Posts'),
      collection('guides', 'outstatic/content/posts/guides', 'posts', 'Guides')
    ])
  })

  it('prefers an explicit parent on nested items', () => {
    expect(
      normalizeCollections([
        {
          title: 'Posts',
          slug: 'posts',
          path: 'outstatic/content/posts',
          children: [
            {
              title: 'Guides',
              slug: 'guides',
              path: 'outstatic/content/posts/guides',
              parent: 'projects',
              children: []
            }
          ]
        }
      ])
    ).toEqual([
      collection('posts', 'outstatic/content/posts', null, 'Posts'),
      collection(
        'guides',
        'outstatic/content/posts/guides',
        'projects',
        'Guides'
      )
    ])
  })

  it('returns an empty array for empty input', () => {
    expect(normalizeCollections()).toEqual([])
  })
})

describe('getCollectionsAfterDeletion', () => {
  const collections = [
    collection('posts', 'outstatic/content/posts'),
    collection('guides', 'outstatic/content/posts/guides', 'posts'),
    collection('chapters', 'outstatic/content/posts/guides/chapters', 'guides'),
    collection('projects', 'outstatic/content/projects')
  ]

  it('removes only the target collection when deleteChildren is false', () => {
    expect(
      getCollectionsAfterDeletion(collections, collections[0], false)
    ).toEqual([
      collection('guides', 'outstatic/content/posts/guides', null),
      collection(
        'chapters',
        'outstatic/content/posts/guides/chapters',
        'guides'
      ),
      collection('projects', 'outstatic/content/projects')
    ])
  })

  it('removes the target and all descendants when deleteChildren is true', () => {
    expect(
      getCollectionsAfterDeletion(collections, collections[0], true)
    ).toEqual([collection('projects', 'outstatic/content/projects')])
  })

  it('re-parents direct children to the deleted collection parent', () => {
    const nestedCollections = [
      collection('blog', 'outstatic/content/blog'),
      collection('posts', 'outstatic/content/blog/posts', 'blog'),
      collection('drafts', 'outstatic/content/blog/posts/drafts', 'posts')
    ]

    expect(
      getCollectionsAfterDeletion(
        nestedCollections,
        nestedCollections[1],
        false
      )
    ).toEqual([
      collection('blog', 'outstatic/content/blog'),
      collection('drafts', 'outstatic/content/blog/posts/drafts', 'blog')
    ])
  })

  it('removes a leaf collection without affecting siblings', () => {
    expect(
      getCollectionsAfterDeletion(collections, collections[3], false)
    ).toEqual(collections.slice(0, 3))
  })
})

describe('getMetadataAfterCollectionDeletion', () => {
  const metadata = [
    { collection: 'posts', slug: 'post-1' },
    { collection: 'guides', slug: 'guide-1' },
    { collection: 'chapters', slug: 'chapter-1' },
    { collection: 'projects', slug: 'project-1' }
  ]

  it('keeps descendant metadata when deleteChildren is false', () => {
    expect(
      getMetadataAfterCollectionDeletion(
        metadata,
        'posts',
        new Set(['guides', 'chapters']),
        false
      )
    ).toEqual([
      { collection: 'guides', slug: 'guide-1' },
      { collection: 'chapters', slug: 'chapter-1' },
      { collection: 'projects', slug: 'project-1' }
    ])
  })

  it('removes descendant metadata when deleteChildren is true', () => {
    expect(
      getMetadataAfterCollectionDeletion(
        metadata,
        'posts',
        new Set(['guides', 'chapters']),
        true
      )
    ).toEqual([{ collection: 'projects', slug: 'project-1' }])
  })
})

describe('buildParentChildRoutes', () => {
  type Route = {
    label: string
    slug?: string
    parent?: string | null
    children?: Route[]
  }

  const routes: Route[] = [
    { label: 'Posts', slug: 'posts', parent: null },
    { label: 'Guides', slug: 'guides', parent: 'posts' },
    { label: 'Projects', slug: 'projects', parent: null },
    { label: 'Orphan', slug: 'orphan', parent: 'missing' }
  ]

  it('nests routes under their parent slug', () => {
    const result = buildParentChildRoutes(routes)

    expect(result).toHaveLength(3)
    expect(result.find((route) => route.slug === 'posts')?.children).toEqual([
      { label: 'Guides', slug: 'guides', parent: 'posts', children: [] }
    ])
  })

  it('places routes with unknown parents at the root', () => {
    const result = buildParentChildRoutes(routes)

    expect(result.some((route) => route.slug === 'orphan')).toBe(true)
  })

  it('preserves existing children and appends parent-linked routes', () => {
    const result = buildParentChildRoutes([
      {
        label: 'Posts',
        slug: 'posts',
        parent: null,
        children: [{ label: 'Pinned', slug: 'pinned', parent: 'posts' }]
      },
      { label: 'Guides', slug: 'guides', parent: 'posts' }
    ])

    expect(result[0].children).toEqual([
      { label: 'Pinned', slug: 'pinned', parent: 'posts' },
      { label: 'Guides', slug: 'guides', parent: 'posts', children: [] }
    ])
  })

  it('does not mutate the input routes', () => {
    const input: Route[] = [
      { label: 'Posts', slug: 'posts', parent: null },
      { label: 'Guides', slug: 'guides', parent: 'posts' }
    ]

    buildParentChildRoutes(input)

    expect(input[0].children).toBeUndefined()
    expect(input).toHaveLength(2)
  })

  it('falls back to root for routes caught in a parent cycle', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})

    const result = buildParentChildRoutes([
      { label: 'A', slug: 'a', parent: 'b' },
      { label: 'B', slug: 'b', parent: 'a' }
    ])

    expect(result.map((route) => route.slug).sort()).toEqual(['a', 'b'])
    expect(warn).toHaveBeenCalledTimes(2)

    warn.mockRestore()
  })
})
