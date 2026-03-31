import { parseContent } from '../parse-content'

describe('parseContent', () => {
  const baseParams = {
    basePath: '/api',
    repoOwner: 'owner',
    repoSlug: 'repo',
    repoBranch: 'main'
  }

  describe('with media paths configured', () => {
    const params = {
      ...baseParams,
      publicMediaPath: 'images/',
      repoMediaPath: 'public/images/'
    }

    it('should replace public media path with API path in image syntax', () => {
      const content = '![Alt text](/images/photo.jpg)'
      const result = parseContent({ ...params, content })

      expect(result).toContain('/api/api/outstatic/media/')
      expect(result).toContain('owner/repo/main/public/images/')
      expect(result).toContain('photo.jpg')
    })

    it('should handle multiple images in content', () => {
      const content = `
# My Document

![Image 1](/images/photo1.jpg)

Some text here.

![Image 2](/images/photo2.png)
`
      const result = parseContent({ ...params, content })

      expect(result).toContain('photo1.jpg')
      expect(result).toContain('photo2.png')
      expect(result.match(/api\/outstatic\/media/g)?.length).toBe(2)
    })

    it('should not modify content without images', () => {
      const content = '# Just a heading\n\nSome paragraph text.'
      const result = parseContent({ ...params, content })

      expect(result).toBe(content)
    })

    it('should not modify images with different paths', () => {
      const content = '![Alt](/other-path/image.jpg)'
      const result = parseContent({ ...params, content })

      expect(result).toBe(content)
    })
  })

  describe('with undefined media paths', () => {
    it('should return content unchanged when publicMediaPath is undefined', () => {
      const content = '![Alt text](/images/photo.jpg)'
      const result = parseContent({
        ...baseParams,
        content,
        publicMediaPath: undefined,
        repoMediaPath: 'public/images/'
      })

      expect(result).toBe(content)
    })

    it('should return content unchanged when repoMediaPath is undefined', () => {
      const content = '![Alt text](/images/photo.jpg)'
      const result = parseContent({
        ...baseParams,
        content,
        publicMediaPath: 'images/',
        repoMediaPath: undefined
      })

      expect(result).toBe(content)
    })

    it('should return content unchanged when both media paths are undefined', () => {
      const content = '![Alt text](/images/photo.jpg)'
      const result = parseContent({
        ...baseParams,
        content,
        publicMediaPath: undefined,
        repoMediaPath: undefined
      })

      expect(result).toBe(content)
    })
  })

  describe('edge cases', () => {
    const params = {
      ...baseParams,
      publicMediaPath: 'media/',
      repoMediaPath: 'public/media/'
    }

    it('should handle empty content', () => {
      const result = parseContent({ ...params, content: '' })
      expect(result).toBe('')
    })

    it('should handle content with special characters in image alt text', () => {
      const content = '![Image with "quotes" & special chars](/media/photo.jpg)'
      const result = parseContent({ ...params, content })

      expect(result).toContain('api/outstatic/media/')
    })

    it('should handle nested paths', () => {
      const params = {
        ...baseParams,
        publicMediaPath: 'assets/images/uploads/',
        repoMediaPath: 'public/assets/images/uploads/'
      }
      const content = '![Alt](/assets/images/uploads/photo.jpg)'
      const result = parseContent({ ...params, content })

      expect(result).toContain('public/assets/images/uploads/')
    })
  })
})
