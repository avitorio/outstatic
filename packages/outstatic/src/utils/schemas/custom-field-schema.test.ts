import { addCustomFieldSchema } from './add-custom-field-schema'

describe('custom field schema validation', () => {
  it('accepts top-level object sub-fields', () => {
    const result = addCustomFieldSchema.safeParse({
      title: 'SEO',
      fieldType: 'Object',
      fields: [
        {
          name: 'title',
          title: 'Title',
          fieldType: 'String'
        },
        {
          name: 'social',
          title: 'Social',
          fieldType: 'Object',
          fields: [
            {
              name: 'image',
              title: 'Image',
              fieldType: 'Image'
            }
          ]
        }
      ]
    })

    expect(result.success).toBe(true)
  })

  it('accepts recursive object and array object sub-fields', () => {
    const result = addCustomFieldSchema.safeParse({
      title: 'Authors',
      fieldType: 'Array',
      itemType: 'Object',
      fields: [
        {
          name: 'author',
          title: 'Author',
          fieldType: 'Object',
          fields: [
            {
              name: 'name',
              title: 'Name',
              fieldType: 'String'
            },
            {
              name: 'books',
              title: 'Books',
              fieldType: 'Array',
              itemType: 'Object',
              fields: [
                {
                  name: 'title',
                  title: 'Title',
                  fieldType: 'String'
                }
              ]
            }
          ]
        }
      ]
    })

    expect(result.success).toBe(true)
  })

  it('rejects array constraints where max is below min', () => {
    const result = addCustomFieldSchema.safeParse({
      title: 'Related Posts',
      fieldType: 'Array',
      itemType: 'String',
      minItems: 3,
      maxItems: 1
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message:
            'Maximum items must be greater than or equal to minimum items.',
          path: ['maxItems']
        })
      ])
    )
  })

  it('rejects duplicate sibling sub-field names at nested levels', () => {
    const result = addCustomFieldSchema.safeParse({
      title: 'Authors',
      fieldType: 'Array',
      itemType: 'Object',
      fields: [
        {
          name: 'author',
          title: 'Author',
          fieldType: 'Object',
          fields: [
            {
              name: 'name',
              title: 'Name',
              fieldType: 'String'
            },
            {
              name: 'name',
              title: 'Display Name',
              fieldType: 'String'
            }
          ]
        }
      ]
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: 'Sub-field names must be unique.',
          path: ['fields', 0, 'fields', 1, 'name']
        })
      ])
    )
  })

  it('requires children for object containers', () => {
    const result = addCustomFieldSchema.safeParse({
      title: 'Authors',
      fieldType: 'Array',
      itemType: 'Object',
      fields: [
        {
          name: 'author',
          title: 'Author',
          fieldType: 'Object',
          fields: []
        }
      ]
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: 'Add at least one sub-field.',
          path: ['fields', 0, 'fields']
        })
      ])
    )
  })

  it('enforces the recursive container depth limit', () => {
    const result = addCustomFieldSchema.safeParse({
      title: 'Authors',
      fieldType: 'Array',
      itemType: 'Object',
      fields: [
        {
          name: 'levelTwo',
          title: 'Level Two',
          fieldType: 'Object',
          fields: [
            {
              name: 'levelThree',
              title: 'Level Three',
              fieldType: 'Object',
              fields: [
                {
                  name: 'levelFour',
                  title: 'Level Four',
                  fieldType: 'Object',
                  fields: [
                    {
                      name: 'name',
                      title: 'Name',
                      fieldType: 'String'
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: 'Sub-fields can be nested up to 3 levels.',
          path: ['fields', 0, 'fields', 0, 'fields', 0, 'fieldType']
        })
      ])
    )
  })
})
