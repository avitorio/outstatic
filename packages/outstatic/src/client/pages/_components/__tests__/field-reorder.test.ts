import type { CustomFieldsType } from '@/types'
import { reorderCustomFields } from '../field-reorder'

const customFields: CustomFieldsType = {
  title: {
    title: 'Title',
    fieldType: 'String',
    dataType: 'string'
  },
  featured: {
    title: 'Featured',
    fieldType: 'Boolean',
    dataType: 'boolean'
  },
  publishedAt: {
    title: 'Published At',
    fieldType: 'Date',
    dataType: 'date'
  }
}

describe('reorderCustomFields', () => {
  it('moves a field to a new position', () => {
    const reordered = reorderCustomFields({
      customFields,
      activeFieldName: 'publishedAt',
      overFieldName: 'title'
    })

    expect(Object.keys(reordered)).toEqual(['publishedAt', 'title', 'featured'])
  })

  it('returns the original object for no-op reorder', () => {
    const reordered = reorderCustomFields({
      customFields,
      activeFieldName: 'title',
      overFieldName: 'title'
    })

    expect(reordered).toBe(customFields)
  })

  it('returns the original object for invalid ids', () => {
    const reordered = reorderCustomFields({
      customFields,
      activeFieldName: 'doesNotExist',
      overFieldName: 'title'
    })

    expect(reordered).toBe(customFields)
  })

  it('preserves field definitions while changing only order', () => {
    const reordered = reorderCustomFields({
      customFields,
      activeFieldName: 'featured',
      overFieldName: 'publishedAt'
    })

    expect(reordered.featured).toEqual(customFields.featured)
    expect(reordered.title).toEqual(customFields.title)
    expect(reordered.publishedAt).toEqual(customFields.publishedAt)
  })
})
