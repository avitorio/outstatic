import {
  createCustomFieldDefinition,
  customFieldTypeLabels,
  customFieldTypes,
  isSelectCustomField
} from './index'

describe('custom field definitions', () => {
  it('includes Select in the supported custom field types', () => {
    expect(customFieldTypes).toContain('Select')
  })

  it('uses a URL-safe rich text key with a display label', () => {
    expect(customFieldTypes).toContain('RichText')
    expect(customFieldTypeLabels.RichText).toBe('Rich Text')
  })

  it('creates a strict select field definition with string storage', () => {
    const field = createCustomFieldDefinition({
      title: 'Category',
      fieldType: 'Select',
      required: true,
      values: [
        { label: 'News', value: 'news' },
        { label: 'Guides', value: 'guides' }
      ]
    })

    expect(field).toEqual({
      title: 'Category',
      fieldType: 'Select',
      dataType: 'string',
      required: true,
      values: [
        { label: 'News', value: 'news' },
        { label: 'Guides', value: 'guides' }
      ]
    })
    expect(isSelectCustomField(field)).toBe(true)
  })
})
