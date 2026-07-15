import { generateGetFileInformationQuery } from './metadata'

describe('generateGetFileInformationQuery', () => {
  it('queries singleton files through GraphQL variables instead of a root tree', () => {
    const query = generateGetFileInformationQuery({
      paths: ['content/posts'],
      singletonPaths: ['about.md'],
      branch: 'main'
    })

    expect(query).toContain('$singleton0: String!')
    expect(query).toContain('singleton0: object(expression: $singleton0)')
    expect(query).not.toContain('main:about.md')
  })
})
