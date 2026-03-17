import { convertSchemaToZod } from './zod'
import type { CustomFieldsType } from '@/types'

describe('convertSchemaToZod', () => {
  it('accepts a valid select value', () => {
    const schema = convertSchemaToZod({
      properties: {
        category: {
          title: 'Category',
          fieldType: 'Select',
          dataType: 'string',
          required: true,
          values: [
            { label: 'News', value: 'news' },
            { label: 'Guides', value: 'guides' }
          ]
        }
      } satisfies CustomFieldsType
    })

    expect(() =>
      schema.parse({
        status: 'draft',
        slug: 'post-with-category',
        author: {},
        category: 'news'
      })
    ).not.toThrow()
  })

  it('rejects a select value outside the configured options', () => {
    const schema = convertSchemaToZod({
      properties: {
        category: {
          title: 'Category',
          fieldType: 'Select',
          dataType: 'string',
          required: true,
          values: [
            { label: 'News', value: 'news' },
            { label: 'Guides', value: 'guides' }
          ]
        }
      } satisfies CustomFieldsType
    })

    expect(() =>
      schema.parse({
        status: 'draft',
        slug: 'post-with-category',
        author: {},
        category: 'updates'
      })
    ).toThrow('Category must be one of the available options.')
  })

  it('allows an optional select field to be unset', () => {
    const schema = convertSchemaToZod({
      properties: {
        category: {
          title: 'Category',
          fieldType: 'Select',
          dataType: 'string',
          values: [
            { label: 'News', value: 'news' },
            { label: 'Guides', value: 'guides' }
          ]
        }
      } satisfies CustomFieldsType
    })

    expect(() =>
      schema.parse({
        status: 'draft',
        slug: 'optional-category',
        author: {}
      })
    ).not.toThrow()
  })
})
