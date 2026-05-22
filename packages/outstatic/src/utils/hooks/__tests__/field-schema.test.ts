import {
  createFieldSchemaDocument,
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
    ).toBe('update field "posts heroTitle" [outstatic:config]')
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
    ).toBe('delete field "singleton/about heroTitle" [outstatic:config]')
  })

  it('builds a settings commit message', () => {
    expect(
      getFieldSchemaCommitMessage(
        {
          kind: 'collection',
          slug: 'posts',
          title: 'Posts'
        },
        'settings',
        'editor settings'
      )
    ).toBe('update settings "posts editor settings" [outstatic:config]')
  })

  it('writes schema settings with custom fields', () => {
    expect(
      JSON.parse(
        createFieldSchemaDocument(
          {
            kind: 'collection',
            slug: 'posts',
            title: 'Posts'
          },
          {
            featured: {
              title: 'Featured',
              fieldType: 'Boolean',
              dataType: 'boolean'
            }
          },
          { fieldsOnlyMode: true }
        )
      )
    ).toEqual({
      title: 'posts',
      type: 'object',
      settings: {
        fieldsOnlyMode: true
      },
      properties: {
        featured: {
          title: 'Featured',
          fieldType: 'Boolean',
          dataType: 'boolean'
        }
      }
    })
  })

  it('normalizes legacy block editor settings', () => {
    expect(
      JSON.parse(
        createFieldSchemaDocument(
          {
            kind: 'collection',
            slug: 'posts',
            title: 'Posts'
          },
          {},
          { disableBlockEditor: true }
        )
      ).settings
    ).toEqual({
      fieldsOnlyMode: true
    })
  })
})
