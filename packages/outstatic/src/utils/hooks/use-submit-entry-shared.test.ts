import { Block } from '@/utils/metadata/types'
import { buildMergedContent } from './use-submit-entry-shared'

const createEditor = ({
  blocks,
  markdown
}: {
  blocks?: Block[]
  markdown: string
}) =>
  ({
    storage: {
      markdown: {
        getMarkdown: () => markdown
      }
    },
    state: {
      doc: {
        descendants: (
          callback: (node: {
            attrs?: {
              outstaticBlockDefinition?: string
            }
          }) => void
        ) => {
          blocks?.forEach((block) =>
            callback({
              attrs: {
                outstaticBlockDefinition: JSON.stringify(block)
              }
            })
          )
        }
      }
    }
  }) as any

const buildContent = ({
  blocks,
  markdown
}: {
  blocks?: Block[]
  markdown: string
}) =>
  buildMergedContent({
    data: {
      content: markdown,
      slug: 'hello-world',
      title: 'Hello world'
    } as any,
    documentMetadata: {},
    editor: createEditor({ blocks, markdown }),
    basePath: '',
    repoOwner: 'owner',
    repoSlug: 'repo',
    repoBranch: 'main',
    publicMediaPath: 'uploads/'
  })

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const stripFrontmatter = (value: string) =>
  value.replace(/^---\n[\s\S]*?---\n\n/, '')

describe('buildMergedContent', () => {
  it('does not duplicate block imports after reopening and saving again', () => {
    const blockImport = "import Callout from '@/components/Callout'"
    const blocks: Block[] = [
      {
        name: 'Callout',
        imports: blockImport,
        props: []
      }
    ]

    const firstSave = buildContent({
      blocks,
      markdown: '<Callout />'
    })
    const reopenedBody = stripFrontmatter(firstSave)
    const secondSave = buildContent({
      blocks,
      markdown: reopenedBody
    })

    expect(firstSave).toContain(`${blockImport}\n\n<Callout />`)
    expect(secondSave).toContain(`${blockImport}\n\n<Callout />`)
    expect(
      secondSave.match(new RegExp(escapeRegExp(blockImport), 'g'))
    ).toHaveLength(1)
  })

  it('keeps manual leading imports and merges them with block imports', () => {
    const manualImport = "import Tag from '@/components/Tag'"
    const blockImport = "import Callout from '@/components/Callout'"
    const blocks: Block[] = [
      {
        name: 'Callout',
        imports: blockImport,
        props: []
      }
    ]

    const merged = buildContent({
      blocks,
      markdown: `${manualImport}\n\n<Callout />`
    })

    expect(merged).toContain(`${manualImport}\n${blockImport}\n\n<Callout />`)
    expect(merged).not.toContain(`${manualImport}\n\n${manualImport}`)
  })

  it('dedupes repeated multiline block imports by whole statement', () => {
    const blockImport = `import {
  Callout,
  Tag
} from '@/components/examples'`
    const blocks: Block[] = [
      {
        name: 'Callout',
        imports: blockImport,
        props: []
      },
      {
        name: 'Tag',
        imports: blockImport,
        props: []
      }
    ]

    const merged = buildContent({
      blocks,
      markdown: '<Callout />\n\n<Tag />'
    })

    expect(merged).toContain(`${blockImport}\n\n<Callout />\n\n<Tag />`)
    expect(
      merged.match(new RegExp(escapeRegExp(blockImport), 'g'))
    ).toHaveLength(1)
  })

  it('does not move regular prose that starts with import', () => {
    const merged = buildContent({
      markdown: 'import something into your story.'
    })

    expect(merged).toContain('---\n\nimport something into your story.')
    expect(merged).not.toContain(
      '---\n\nimport something into your story.\n\nimport something into your story.'
    )
  })
})
