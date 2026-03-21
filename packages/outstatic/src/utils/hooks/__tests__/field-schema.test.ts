import {
  getFieldSchemaCommitMessage,
  getFieldSchemaFilePath,
  getFieldSchemaRequestPath
} from '../field-schema'

describe('field schema target helpers', () => {
  it('builds the collection schema file path', () => {
    expect(
      getFieldSchemaFilePath(
        {
          kind: 'collection',
          slug: 'posts',
          title: 'Posts'
        },
        'content'
      )
    ).toBe('content/posts/schema.json')
  })

  it('builds the singleton schema file path and request path', () => {
    const target = {
      kind: 'singleton' as const,
      slug: 'about',
      title: 'About'
    }

    expect(getFieldSchemaFilePath(target, 'content')).toBe(
      'content/_singletons/about.schema.json'
    )
    expect(getFieldSchemaRequestPath(target, 'content', 'canary')).toBe(
      'canary:content/_singletons/about.schema.json'
    )
  })

  it('builds an action-aware collection commit message', () => {
    expect(
      getFieldSchemaCommitMessage(
        {
          kind: 'collection',
          slug: 'posts',
          title: 'Posts'
        },
        'edit',
        'heroTitle'
      )
    ).toBe('feat(posts): edit heroTitle field')
  })

  it('builds a singleton delete commit message', () => {
    expect(
      getFieldSchemaCommitMessage(
        {
          kind: 'singleton',
          slug: 'about',
          title: 'About'
        },
        'delete',
        'heroTitle'
      )
    ).toBe('feat(singleton/about): delete heroTitle field')
  })
})
