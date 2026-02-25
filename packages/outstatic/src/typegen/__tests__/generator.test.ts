import fs from 'fs'
import path from 'path'
import { generateTypes } from '../generator'

// Mock fs module
jest.mock('fs')
const mockFs = fs as jest.Mocked<typeof fs>

// Helper to create mock Dirent objects
const createMockDirent = (name: string, isDir: boolean) => ({
  name,
  isDirectory: () => isDir,
  isFile: () => !isDir
})

describe('generateTypes', () => {
  const mockCwd = '/test/project'

  beforeEach(() => {
    jest.clearAllMocks()
    // Default mock implementations
    mockFs.existsSync.mockReturnValue(true)
    mockFs.mkdirSync.mockImplementation(() => undefined)
    mockFs.writeFileSync.mockImplementation(() => undefined)
  })

  it('skips generation when content directory does not exist', () => {
    mockFs.existsSync.mockReturnValue(false)

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

    generateTypes({ cwd: mockCwd })

    expect(consoleSpy).toHaveBeenCalledWith(
      'No collections or singletons found. Skipping type generation.'
    )
    expect(mockFs.writeFileSync).not.toHaveBeenCalled()

    consoleSpy.mockRestore()
  })

  it('discovers collections from content directory', () => {
    const contentPath = path.join(mockCwd, 'outstatic/content')

    mockFs.existsSync.mockImplementation((p) => {
      if (p === contentPath) return true
      if (p === path.join(contentPath, '_singletons')) return false
      if (p === path.join(contentPath, 'posts/schema.json')) return true
      return false
    })
    ;(mockFs.readdirSync as jest.Mock).mockImplementation((p: string) => {
      if (p === contentPath) {
        return [createMockDirent('posts', true)]
      }
      return []
    })

    mockFs.readFileSync.mockImplementation((p) => {
      if (String(p).includes('schema.json')) {
        return JSON.stringify({
          title: 'Posts',
          type: 'object',
          properties: {
            featured: {
              title: 'Featured',
              fieldType: 'checkbox',
              dataType: 'boolean'
            }
          }
        })
      }
      return ''
    })

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

    generateTypes({ cwd: mockCwd })

    // Should write type files
    expect(mockFs.writeFileSync).toHaveBeenCalled()

    // Check that posts.ts was written
    const writeFileCalls = mockFs.writeFileSync.mock.calls
    const postsTypeFile = writeFileCalls.find((call) =>
      String(call[0]).includes('posts.ts')
    )
    expect(postsTypeFile).toBeDefined()

    consoleSpy.mockRestore()
  })

  it('discovers singletons from _singletons directory', () => {
    const contentPath = path.join(mockCwd, 'outstatic/content')
    const singletonsPath = path.join(contentPath, '_singletons')

    mockFs.existsSync.mockImplementation((p) => {
      if (p === contentPath) return true
      if (p === singletonsPath) return true
      return false
    })
    ;(mockFs.readdirSync as jest.Mock).mockImplementation((p: string) => {
      if (p === contentPath) {
        return []
      }
      if (p === singletonsPath) {
        return [createMockDirent('home.schema.json', false)]
      }
      return []
    })

    mockFs.readFileSync.mockImplementation((p) => {
      if (String(p).includes('home.schema.json')) {
        return JSON.stringify({
          title: 'Home',
          type: 'object',
          properties: {
            hero: {
              title: 'Hero',
              fieldType: 'text',
              dataType: 'string'
            }
          }
        })
      }
      return ''
    })

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

    generateTypes({ cwd: mockCwd })

    // Should create _singletons output directory
    expect(mockFs.mkdirSync).toHaveBeenCalled()

    // Check that home.ts was written in _singletons
    const writeFileCalls = mockFs.writeFileSync.mock.calls
    const singletonTypeFile = writeFileCalls.find(
      (call) =>
        String(call[0]).includes('_singletons') &&
        String(call[0]).includes('home.ts')
    )
    expect(singletonTypeFile).toBeDefined()

    consoleSpy.mockRestore()
  })

  it('generates collections.ts with type unions', () => {
    const contentPath = path.join(mockCwd, 'outstatic/content')

    mockFs.existsSync.mockImplementation((p) => {
      if (p === contentPath) return true
      if (p === path.join(contentPath, '_singletons')) return false
      if (p === path.join(contentPath, 'posts/schema.json')) return true
      if (p === path.join(contentPath, 'pages/schema.json')) return true
      return false
    })
    ;(mockFs.readdirSync as jest.Mock).mockImplementation((p: string) => {
      if (p === contentPath) {
        return [
          createMockDirent('posts', true),
          createMockDirent('pages', true)
        ]
      }
      return []
    })

    mockFs.readFileSync.mockImplementation(() => {
      return JSON.stringify({
        title: 'Test',
        type: 'object',
        properties: {}
      })
    })

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

    generateTypes({ cwd: mockCwd })

    // Find collections.ts write call
    const writeFileCalls = mockFs.writeFileSync.mock.calls
    const collectionsFile = writeFileCalls.find((call) =>
      String(call[0]).endsWith('collections.ts')
    )
    expect(collectionsFile).toBeDefined()

    const content = collectionsFile?.[1] as string
    expect(content).toContain("export type CollectionName = 'posts' | 'pages'")
    expect(content).toContain('export interface Collections')

    consoleSpy.mockRestore()
  })

  it('generates api.d.ts with typed overloads', () => {
    const contentPath = path.join(mockCwd, 'outstatic/content')

    mockFs.existsSync.mockImplementation((p) => {
      if (p === contentPath) return true
      if (p === path.join(contentPath, '_singletons')) return false
      if (p === path.join(contentPath, 'posts/schema.json')) return true
      return false
    })
    ;(mockFs.readdirSync as jest.Mock).mockImplementation((p: string) => {
      if (p === contentPath) {
        return [createMockDirent('posts', true)]
      }
      return []
    })

    mockFs.readFileSync.mockImplementation(() => {
      return JSON.stringify({
        title: 'Posts',
        type: 'object',
        properties: {}
      })
    })

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

    generateTypes({ cwd: mockCwd })

    // Find api.d.ts write call
    const writeFileCalls = mockFs.writeFileSync.mock.calls
    const apiFile = writeFileCalls.find((call) =>
      String(call[0]).endsWith('api.d.ts')
    )
    expect(apiFile).toBeDefined()

    const content = apiFile?.[1] as string
    expect(content).toContain("declare module 'outstatic/server'")
    expect(content).toContain('export function getDocuments')
    expect(content).toContain('export function load')

    consoleSpy.mockRestore()
  })

  it('generates index.ts that re-exports all types', () => {
    const contentPath = path.join(mockCwd, 'outstatic/content')

    mockFs.existsSync.mockImplementation((p) => {
      if (p === contentPath) return true
      if (p === path.join(contentPath, '_singletons')) return false
      if (p === path.join(contentPath, 'posts/schema.json')) return true
      return false
    })
    ;(mockFs.readdirSync as jest.Mock).mockImplementation((p: string) => {
      if (p === contentPath) {
        return [createMockDirent('posts', true)]
      }
      return []
    })

    mockFs.readFileSync.mockImplementation(() => {
      return JSON.stringify({
        title: 'Posts',
        type: 'object',
        properties: {}
      })
    })

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

    generateTypes({ cwd: mockCwd })

    // Find index.ts write call
    const writeFileCalls = mockFs.writeFileSync.mock.calls
    const indexFile = writeFileCalls.find((call) =>
      String(call[0]).endsWith('index.ts')
    )
    expect(indexFile).toBeDefined()

    const content = indexFile?.[1] as string
    expect(content).toContain("export * from './collections'")
    expect(content).toContain("export * from './posts'")

    consoleSpy.mockRestore()
  })

  it('uses custom content and output paths', () => {
    const customContentPath = path.join(mockCwd, 'custom/content')
    const customOutputPath = path.join(mockCwd, 'custom/types')

    mockFs.existsSync.mockImplementation((p) => {
      if (p === customContentPath) return true
      if (p === path.join(customContentPath, '_singletons')) return false
      if (p === path.join(customContentPath, 'blog/schema.json')) return true
      return false
    })
    ;(mockFs.readdirSync as jest.Mock).mockImplementation((p: string) => {
      if (p === customContentPath) {
        return [createMockDirent('blog', true)]
      }
      return []
    })

    mockFs.readFileSync.mockImplementation(() => {
      return JSON.stringify({
        title: 'Blog',
        type: 'object',
        properties: {}
      })
    })

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

    generateTypes({
      cwd: mockCwd,
      contentPath: 'custom/content',
      outputPath: 'custom/types'
    })

    // Check output directory was created at custom path
    expect(mockFs.mkdirSync).toHaveBeenCalledWith(customOutputPath, {
      recursive: true
    })

    // Check files were written to custom output path
    const writeFileCalls = mockFs.writeFileSync.mock.calls
    const blogTypeFile = writeFileCalls.find(
      (call) =>
        String(call[0]).includes('custom/types') &&
        String(call[0]).includes('blog.ts')
    )
    expect(blogTypeFile).toBeDefined()

    consoleSpy.mockRestore()
  })

  it('handles schema parse errors gracefully', () => {
    const contentPath = path.join(mockCwd, 'outstatic/content')

    mockFs.existsSync.mockImplementation((p) => {
      if (p === contentPath) return true
      if (p === path.join(contentPath, '_singletons')) return false
      if (p === path.join(contentPath, 'posts/schema.json')) return true
      return false
    })
    ;(mockFs.readdirSync as jest.Mock).mockImplementation((p: string) => {
      if (p === contentPath) {
        return [createMockDirent('posts', true)]
      }
      return []
    })

    mockFs.readFileSync.mockImplementation(() => {
      return 'invalid json {'
    })

    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()

    generateTypes({ cwd: mockCwd })

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to parse schema for collection'),
      expect.anything()
    )

    consoleWarnSpy.mockRestore()
    consoleLogSpy.mockRestore()
  })

  it('skips hidden directories', () => {
    const contentPath = path.join(mockCwd, 'outstatic/content')

    mockFs.existsSync.mockImplementation((p) => {
      if (p === contentPath) return true
      if (p === path.join(contentPath, '_singletons')) return false
      return false
    })
    ;(mockFs.readdirSync as jest.Mock).mockImplementation((p: string) => {
      if (p === contentPath) {
        return [
          createMockDirent('.hidden', true),
          createMockDirent('posts', true)
        ]
      }
      return []
    })

    mockFs.readFileSync.mockImplementation(() => {
      return JSON.stringify({
        title: 'Posts',
        type: 'object',
        properties: {}
      })
    })

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

    generateTypes({ cwd: mockCwd })

    // Should not create a type file for .hidden
    const writeFileCalls = mockFs.writeFileSync.mock.calls
    const hiddenFile = writeFileCalls.find((call) =>
      String(call[0]).includes('.hidden')
    )
    expect(hiddenFile).toBeUndefined()

    consoleSpy.mockRestore()
  })
})
