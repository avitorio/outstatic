import {
  buildPublicMediaPath,
  deriveStoredMediaExtensions,
  getFilenameFromPublicMediaPath,
  getPresetExtensionsForCategories,
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
})
