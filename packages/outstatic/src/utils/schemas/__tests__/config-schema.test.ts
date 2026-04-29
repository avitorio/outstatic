import { ConfigSchema } from '../config-schema'

describe('ConfigSchema', () => {
  describe('mdExtension', () => {
    it('should accept "md" as a valid mdExtension value', () => {
      const result = ConfigSchema.safeParse({ mdExtension: 'md' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.mdExtension).toBe('md')
      }
    })

    it('should accept "mdx" as a valid mdExtension value', () => {
      const result = ConfigSchema.safeParse({ mdExtension: 'mdx' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.mdExtension).toBe('mdx')
      }
    })

    it('should reject invalid mdExtension values', () => {
      const result = ConfigSchema.safeParse({ mdExtension: 'txt' })
      expect(result.success).toBe(false)
    })

    it('should allow mdExtension to be undefined', () => {
      const result = ConfigSchema.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.mdExtension).toBeUndefined()
      }
    })
  })

  describe('publicMediaPath', () => {
    it('should accept valid publicMediaPath ending with /', () => {
      const result = ConfigSchema.safeParse({ publicMediaPath: 'images/' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.publicMediaPath).toBe('images/')
      }
    })

    it('should reject publicMediaPath not ending with /', () => {
      const result = ConfigSchema.safeParse({ publicMediaPath: 'images' })
      expect(result.success).toBe(false)
    })

    it('should allow publicMediaPath to be undefined', () => {
      const result = ConfigSchema.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.publicMediaPath).toBeUndefined()
      }
    })

    it('should reject empty publicMediaPath', () => {
      const result = ConfigSchema.safeParse({ publicMediaPath: '' })
      expect(result.success).toBe(false)
    })

    it('should reject parent-directory segments in publicMediaPath', () => {
      const result = ConfigSchema.safeParse({ publicMediaPath: '../images/' })
      expect(result.success).toBe(false)
    })
  })

  describe('repoMediaPath', () => {
    it('should accept valid repoMediaPath ending with /', () => {
      const result = ConfigSchema.safeParse({ repoMediaPath: 'public/images/' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.repoMediaPath).toBe('public/images/')
      }
    })

    it('should reject repoMediaPath not ending with /', () => {
      const result = ConfigSchema.safeParse({ repoMediaPath: 'public/images' })
      expect(result.success).toBe(false)
    })

    it('should allow repoMediaPath to be undefined', () => {
      const result = ConfigSchema.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.repoMediaPath).toBeUndefined()
      }
    })

    it('should reject parent-directory segments in repoMediaPath', () => {
      const result = ConfigSchema.safeParse({ repoMediaPath: '../public/' })
      expect(result.success).toBe(false)
    })
  })

  describe('combined config', () => {
    it('should accept config with only mdExtension', () => {
      const result = ConfigSchema.safeParse({ mdExtension: 'mdx' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({ mdExtension: 'mdx' })
      }
    })

    it('should accept config with only media paths', () => {
      const result = ConfigSchema.safeParse({
        publicMediaPath: 'images/',
        repoMediaPath: 'public/images/'
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({
          publicMediaPath: 'images/',
          repoMediaPath: 'public/images/'
        })
      }
    })

    it('should accept full config with all fields', () => {
      const result = ConfigSchema.safeParse({
        publicMediaPath: 'images/',
        repoMediaPath: 'public/images/',
        mdExtension: 'md'
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({
          publicMediaPath: 'images/',
          repoMediaPath: 'public/images/',
          mdExtension: 'md'
        })
      }
    })

    it('should accept empty config', () => {
      const result = ConfigSchema.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({})
      }
    })

    it('preserves custom media output paths exactly as entered', () => {
      const result = ConfigSchema.safeParse({
        media: [
          {
            name: 'images',
            label: 'Images',
            input: 'media/images',
            output: './assets',
            extensions: ['png']
          }
        ]
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.media?.[0]?.output).toBe('./assets')
      }
    })

    it('rejects duplicate media source names after normalization', () => {
      const result = ConfigSchema.safeParse({
        media: [
          {
            name: 'Images',
            label: 'Images',
            input: 'media/images',
            output: '/media/images',
            extensions: ['png']
          },
          {
            name: 'images',
            label: 'Images',
            input: 'media/photos',
            output: '/media/photos',
            extensions: ['jpg']
          }
        ]
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(
          result.error.issues.some(
            (issue) =>
              issue.path.join('.') === 'media.0.name' &&
              issue.message.includes('must be unique')
          )
        ).toBe(true)
        expect(
          result.error.issues.some(
            (issue) =>
              issue.path.join('.') === 'media.1.name' &&
              issue.message.includes('must be unique')
          )
        ).toBe(true)
      }
    })

    it('rejects parent-directory segments in media source input paths', () => {
      const result = ConfigSchema.safeParse({
        media: [
          {
            name: 'images',
            label: 'Images',
            input: '../../private',
            output: '/media/images',
            extensions: ['png']
          }
        ]
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(
          result.error.issues.some(
            (issue) =>
              issue.path.join('.') === 'media.0.input' &&
              issue.message.includes('must not contain parent-directory')
          )
        ).toBe(true)
      }
    })

    it('rejects parent-directory segments in media source output paths', () => {
      const result = ConfigSchema.safeParse({
        media: [
          {
            name: 'images',
            label: 'Images',
            input: 'media/images',
            output: '../public/images',
            extensions: ['png']
          }
        ]
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(
          result.error.issues.some(
            (issue) =>
              issue.path.join('.') === 'media.0.output' &&
              issue.message.includes('must not contain parent-directory')
          )
        ).toBe(true)
      }
    })

    it('rejects overlapping media source extensions', () => {
      const result = ConfigSchema.safeParse({
        media: [
          {
            name: 'images',
            label: 'Images',
            input: 'media/images',
            output: '/media/images',
            categories: ['image']
          },
          {
            name: 'photos',
            label: 'Photos',
            input: 'media/photos',
            output: '/media/photos',
            extensions: ['png', 'webp']
          }
        ]
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(
          result.error.issues.some(
            (issue) =>
              issue.path.join('.') === 'media.0.extensions' &&
              issue.message.includes('png') &&
              issue.message.includes('webp')
          )
        ).toBe(true)
        expect(
          result.error.issues.some(
            (issue) =>
              issue.path.join('.') === 'media.1.extensions' &&
              issue.message.includes('png') &&
              issue.message.includes('webp')
          )
        ).toBe(true)
      }
    })
  })
})
