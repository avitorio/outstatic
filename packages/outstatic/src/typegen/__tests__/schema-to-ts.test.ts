import {
  dataTypeToTS,
  sanitizeFieldName,
  schemaToInterface,
  slugToInterfaceName,
  Schema,
  SchemaField
} from '../schema-to-ts'

describe('schema-to-ts', () => {
  describe('dataTypeToTS', () => {
    it('converts string type correctly', () => {
      const field: SchemaField = {
        title: 'Test',
        fieldType: 'text',
        dataType: 'string'
      }
      expect(dataTypeToTS(field)).toBe('string')
    })

    it('converts number type correctly', () => {
      const field: SchemaField = {
        title: 'Test',
        fieldType: 'number',
        dataType: 'number'
      }
      expect(dataTypeToTS(field)).toBe('number')
    })

    it('converts boolean type correctly', () => {
      const field: SchemaField = {
        title: 'Test',
        fieldType: 'checkbox',
        dataType: 'boolean'
      }
      expect(dataTypeToTS(field)).toBe('boolean')
    })

    it('converts date type to string', () => {
      const field: SchemaField = {
        title: 'Test',
        fieldType: 'date',
        dataType: 'date'
      }
      expect(dataTypeToTS(field)).toBe('string')
    })

    it('converts image type to string', () => {
      const field: SchemaField = {
        title: 'Test',
        fieldType: 'image',
        dataType: 'image'
      }
      expect(dataTypeToTS(field)).toBe('string')
    })

    it('converts array type with predefined values to union type', () => {
      const field: SchemaField = {
        title: 'Tags',
        fieldType: 'tags',
        dataType: 'array',
        values: [
          { label: 'JavaScript', value: 'javascript' },
          { label: 'TypeScript', value: 'typescript' }
        ]
      }
      expect(dataTypeToTS(field)).toBe(
        "Array<{ label: string; value: 'javascript' | 'typescript' }>"
      )
    })

    it('converts array type without values to generic array', () => {
      const field: SchemaField = {
        title: 'Tags',
        fieldType: 'tags',
        dataType: 'array'
      }
      expect(dataTypeToTS(field)).toBe(
        'Array<{ label: string; value: string }>'
      )
    })

    it('returns unknown for unrecognized types', () => {
      const field: SchemaField = {
        title: 'Test',
        fieldType: 'unknown',
        dataType: 'something-else' as any
      }
      expect(dataTypeToTS(field)).toBe('unknown')
    })
  })

  describe('sanitizeFieldName', () => {
    it('returns valid field names unchanged', () => {
      expect(sanitizeFieldName('title')).toBe('title')
      expect(sanitizeFieldName('myField')).toBe('myField')
      expect(sanitizeFieldName('_private')).toBe('_private')
      expect(sanitizeFieldName('$special')).toBe('$special')
    })

    it('wraps field names with special characters in quotes', () => {
      expect(sanitizeFieldName('field-name')).toBe("'field-name'")
      expect(sanitizeFieldName('field.name')).toBe("'field.name'")
      expect(sanitizeFieldName('123field')).toBe("'123field'")
      expect(sanitizeFieldName('field name')).toBe("'field name'")
    })
  })

  describe('slugToInterfaceName', () => {
    it('converts simple slugs to PascalCase', () => {
      expect(slugToInterfaceName('posts')).toBe('Posts')
      expect(slugToInterfaceName('blog')).toBe('Blog')
    })

    it('converts hyphenated slugs to PascalCase', () => {
      expect(slugToInterfaceName('blog-posts')).toBe('BlogPosts')
      expect(slugToInterfaceName('my-collection')).toBe('MyCollection')
    })

    it('converts underscored slugs to PascalCase', () => {
      expect(slugToInterfaceName('blog_posts')).toBe('BlogPosts')
      expect(slugToInterfaceName('my_collection')).toBe('MyCollection')
    })

    it('handles mixed case input', () => {
      expect(slugToInterfaceName('POSTS')).toBe('Posts')
      expect(slugToInterfaceName('MyPosts')).toBe('Myposts')
    })
  })

  describe('schemaToInterface', () => {
    it('generates interface with simple fields', () => {
      const schema: Schema = {
        title: 'Posts',
        type: 'object',
        properties: {
          title: {
            title: 'Title',
            fieldType: 'text',
            dataType: 'string',
            required: true
          },
          views: {
            title: 'Views',
            fieldType: 'number',
            dataType: 'number'
          }
        }
      }

      const result = schemaToInterface(schema, 'Posts')

      expect(result).toContain('export interface PostsFields {')
      expect(result).toContain('title: string')
      expect(result).toContain('views?: number')
      expect(result).toContain('}')
    })

    it('generates interface with optional fields', () => {
      const schema: Schema = {
        title: 'Posts',
        type: 'object',
        properties: {
          title: {
            title: 'Title',
            fieldType: 'text',
            dataType: 'string',
            required: true
          },
          description: {
            title: 'Description',
            fieldType: 'text',
            dataType: 'string',
            required: false
          }
        }
      }

      const result = schemaToInterface(schema, 'Posts')

      expect(result).toContain('title: string')
      expect(result).toContain('description?: string')
    })

    it('includes field descriptions as JSDoc comments', () => {
      const schema: Schema = {
        title: 'Posts',
        type: 'object',
        properties: {
          title: {
            title: 'Title',
            fieldType: 'text',
            dataType: 'string',
            description: 'The post title'
          }
        }
      }

      const result = schemaToInterface(schema, 'Posts')

      expect(result).toContain('/** The post title */')
    })

    it('handles empty properties', () => {
      const schema: Schema = {
        title: 'Empty',
        type: 'object',
        properties: {}
      }

      const result = schemaToInterface(schema, 'Empty')

      expect(result).toContain('export interface EmptyFields {')
      expect(result).toContain('}')
    })

    it('handles array fields with values', () => {
      const schema: Schema = {
        title: 'Posts',
        type: 'object',
        properties: {
          tags: {
            title: 'Tags',
            fieldType: 'tags',
            dataType: 'array',
            values: [
              { label: 'Tech', value: 'tech' },
              { label: 'News', value: 'news' }
            ]
          }
        }
      }

      const result = schemaToInterface(schema, 'Posts')

      expect(result).toContain("Array<{ label: string; value: 'tech' | 'news' }>")
    })
  })
})
