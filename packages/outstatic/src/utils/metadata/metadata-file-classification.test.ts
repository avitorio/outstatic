import { classifyMetadataFile } from './metadata-file-classification'

describe('classifyMetadataFile', () => {
  it('keeps declared root singletons while excluding unrelated root files', () => {
    const singletonPaths = new Set(['about.md'])

    expect(
      classifyMetadataFile({
        path: 'about.md',
        singletonPaths,
        singletonDirectories: ['']
      })
    ).toEqual({ include: true, collection: '_singletons' })
    expect(
      classifyMetadataFile({
        path: 'post.md',
        singletonPaths,
        singletonDirectories: ['']
      })
    ).toEqual({ include: false })
  })

  it('assigns root files to an explicitly configured root collection', () => {
    expect(
      classifyMetadataFile({
        path: 'post.md',
        singletonPaths: new Set(['about.md']),
        singletonDirectories: [''],
        rootCollectionSlug: 'posts'
      })
    ).toEqual({ include: true, collection: 'posts' })
  })

  it('excludes non-singleton files in nested singleton directories', () => {
    expect(
      classifyMetadataFile({
        path: 'pages/contact.md',
        singletonPaths: new Set(['pages/about.md']),
        singletonDirectories: ['pages']
      })
    ).toEqual({ include: false })
  })
})
