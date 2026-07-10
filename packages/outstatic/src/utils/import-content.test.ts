import { composeImportFiles } from './import-content'

describe('composeImportFiles', () => {
  it('returns configuration files without schemas when every selection is already configured', () => {
    const result = composeImportFiles({
      selections: [],
      singletons: [],
      existingCollections: [],
      existingSingletons: [],
      ostContent: 'outstatic/content'
    })

    expect(result.skipped).toEqual([])
    expect(result.files).toEqual([
      { path: 'outstatic/content/collections.json', content: '[]\n' },
      { path: 'outstatic/content/singletons.json', content: '[]\n' }
    ])
  })
})
