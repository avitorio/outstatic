import {
  createCustomFieldDefinition,
  customFieldTypeLabels,
  customFieldTypes,
  isObjectCustomField,
  isRepeatableArrayCustomField,
  isSelectCustomField
} from './index'

describe('custom field definitions', () => {
  it('includes Select in the supported custom field types', () => {
    expect(customFieldTypes).toContain('Select')
  })

  it('includes Object in the supported custom field types', () => {
    expect(customFieldTypes).toContain('Object')
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

  it('creates recursive array object field definitions', () => {
    const field = createCustomFieldDefinition({
      title: 'Authors',
      fieldType: 'Array',
      itemType: 'Object',
      fields: {
        author: {
          title: 'Author',
          fieldType: 'Object',
          required: true,
          fields: {
            name: {
              title: 'Name',
              fieldType: 'String',
              required: true
            },
            books: {
              title: 'Books',
              fieldType: 'Array',
              itemType: 'Object',
              fields: {
                title: {
                  title: 'Title',
                  fieldType: 'String'
                }
              }
            }
          }
        }
      }
    })

    expect(isRepeatableArrayCustomField(field)).toBe(true)
    expect(field).toMatchObject({
      title: 'Authors',
      fieldType: 'Array',
      dataType: 'array',
      itemType: 'Object',
      fields: {
        author: {
          title: 'Author',
          fieldType: 'Object',
          dataType: 'object',
          required: true,
          fields: {
            name: {
              title: 'Name',
              fieldType: 'String',
              dataType: 'string',
              required: true
            },
            books: {
              title: 'Books',
              fieldType: 'Array',
              dataType: 'array',
              itemType: 'Object',
              fields: {
                title: {
                  title: 'Title',
                  fieldType: 'String',
                  dataType: 'string'
                }
              }
            }
          }
        }
      }
    })
  })

  it('preserves array item constraints on field definitions', () => {
    const field = createCustomFieldDefinition({
      title: 'Related posts',
      fieldType: 'Array',
      itemType: 'String',
      minItems: 1,
      maxItems: 3
    })

    expect(field).toMatchObject({
      title: 'Related posts',
      fieldType: 'Array',
      dataType: 'array',
      itemType: 'String',
      minItems: 1,
      maxItems: 3
    })
  })

  it('creates top-level object field definitions', () => {
    const field = createCustomFieldDefinition({
      title: 'SEO',
      fieldType: 'Object',
      fields: {
        title: {
          title: 'Title',
          fieldType: 'String',
          required: true
        },
        social: {
          title: 'Social',
          fieldType: 'Object',
          fields: {
            image: {
              title: 'Image',
              fieldType: 'Image'
            }
          }
        }
      }
    })

    expect(isObjectCustomField(field)).toBe(true)
    expect(field).toMatchObject({
      title: 'SEO',
      fieldType: 'Object',
      dataType: 'object',
      fields: {
        title: {
          title: 'Title',
          fieldType: 'String',
          dataType: 'string',
          required: true
        },
        social: {
          title: 'Social',
          fieldType: 'Object',
          dataType: 'object',
          fields: {
            image: {
              title: 'Image',
              fieldType: 'Image',
              dataType: 'image'
            }
          }
        }
      }
    })
  })
})
