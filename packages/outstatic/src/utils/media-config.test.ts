import {
  buildPublicMediaPath,
  deriveStoredMediaExtensions,
  getFilenameFromPublicMediaPath,
  getPresetExtensionsForCategories,
  getSourceForRepoPath,
  getSourceForPublicPath,
  normalizeMediaSource
} from './media-config'

describe('media-config helpers', () => {
  it('expands category presets into unique extensions', () => {
    expect(
      getPresetExtensionsForCategories(['document', 'spreadsheet'])
    ).toEqual([
      'doc',
      'docx',
      'md',
      'mdx',
      'pdf',
      'rtf',
      'txt',
      'csv',
      'ods',
      'xls',
      'xlsx'
    ])
  })

  it('keeps categories when the extension list fully matches the presets', () => {
    expect(
      deriveStoredMediaExtensions({
        categories: ['document'],
        extensions: ['doc', 'docx', 'md', 'mdx', 'pdf', 'rtf', 'txt', 'epub']
      })
    ).toEqual({
      categories: ['document'],
      extensions: ['epub']
    })
  })

  it('falls back to explicit extensions when the list diverges from the presets', () => {
    expect(
      deriveStoredMediaExtensions({
        categories: ['document'],
        extensions: ['doc', 'docx', 'md', 'mdx', 'pdf', 'txt']
      })
    ).toEqual({
      categories: undefined,
      extensions: ['doc', 'docx', 'md', 'mdx', 'pdf', 'txt']
    })
  })

  it('preserves custom output paths when normalizing media sources', () => {
    expect(
      normalizeMediaSource({
        name: ' Images ',
        label: ' Images ',
        input: '/media/images/',
        output: './assets',
        categories: ['image']
      })
    ).toMatchObject({
      name: 'images',
      label: 'Images',
      input: 'media/images',
      output: './assets'
    })
  })

  it('matches and builds relative public media paths without rewriting the output', () => {
    const source = normalizeMediaSource({
      name: 'images',
      label: 'Images',
      input: 'media/images',
      output: './assets',
      categories: ['image']
    })

    expect(buildPublicMediaPath(source, 'example.png')).toBe(
      './assets/example.png'
    )
    expect(getSourceForPublicPath('./assets/example.png', [source])).toEqual(
      source
    )
    expect(getFilenameFromPublicMediaPath('./assets/example.png', source)).toBe(
      'example.png'
    )
  })

  it('prefers the most specific source when repo paths overlap', () => {
    const sources = [
      normalizeMediaSource({
        name: 'media',
        label: 'Media',
        input: 'media',
        output: '/media',
        categories: ['image']
      }),
      normalizeMediaSource({
        name: 'docs',
        label: 'Docs',
        input: 'media/docs',
        output: '/media/docs',
        categories: ['document']
      })
    ]

    expect(getSourceForRepoPath('media/docs/file.pdf', sources)?.name).toBe(
      'docs'
    )
    expect(getSourceForPublicPath('/media/docs/file.pdf', sources)?.name).toBe(
      'docs'
    )
  })

  it('does not match sibling prefixes that only share a startsWith prefix', () => {
    const source = normalizeMediaSource({
      name: 'media',
      label: 'Media',
      input: 'media',
      output: '/media',
      categories: ['image']
    })

    expect(getSourceForRepoPath('media-backup/file.png', [source])).toBe(
      undefined
    )
    expect(getSourceForPublicPath('/media-backup/file.png', [source])).toBe(
      undefined
    )
  })
})
