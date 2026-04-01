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

  it('coerces an ISO date string into a Date object for date fields', () => {
    const schema = convertSchemaToZod({
      properties: {
        eventDate: {
          title: 'Event Date',
          fieldType: 'Date',
          dataType: 'date',
          required: true
        }
      } satisfies CustomFieldsType
    })

    const result = schema.parse({
      status: 'draft',
      slug: 'post-with-date',
      author: {},
      eventDate: '2024-01-15T10:30:00.000Z'
    })

    expect(result.eventDate).toBeInstanceOf(Date)
    expect((result.eventDate as Date).toISOString()).toBe(
      '2024-01-15T10:30:00.000Z'
    )
  })

  it('shows a required message when a required date field is missing', () => {
    const schema = convertSchemaToZod({
      properties: {
        eventDate: {
          title: 'Event Date',
          fieldType: 'Date',
          dataType: 'date',
          required: true
        }
      } satisfies CustomFieldsType
    })

    expect(() =>
      schema.parse({
        status: 'draft',
        slug: 'post-with-missing-date',
        author: {}
      })
    ).toThrow('Event Date is a required field.')
  })

  it('shows a custom validation message for invalid required date values', () => {
    const schema = convertSchemaToZod({
      properties: {
        eventDate: {
          title: 'Event Date',
          fieldType: 'Date',
          dataType: 'date',
          required: true
        }
      } satisfies CustomFieldsType
    })

    expect(() =>
      schema.parse({
        status: 'draft',
        slug: 'post-with-invalid-date',
        author: {},
        eventDate: new Date('invalid')
      })
    ).toThrow('Event Date must be a valid date.')
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
