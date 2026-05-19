import {
  annotateMdxBlocksWithLibraryMetadata,
  getBlockMdxAttributes
} from './block-mdx'
import { Block } from '@/utils/metadata/types'

const calloutBlock: Block = {
  name: 'Callout',
  description: 'Reusable callout',
  props: [
    { name: 'title', type: 'String', defaultValue: 'Untitled' },
    { name: 'body', type: 'Text' },
    { name: 'count', type: 'Number' },
    { name: 'featured', type: 'Boolean' },
    { name: 'image', type: 'Image' },
    { name: 'theme', type: 'Select', options: ['info', 'warn'] },
    { name: 'publishedAt', type: 'Date' }
  ]
}

describe('getBlockMdxAttributes', () => {
  it('loads block-library metadata from self-closing MDX blocks', () => {
    const attrs = getBlockMdxAttributes(
      '<Callout title="A &quot;quoted&quot; &amp; escaped title" body={"Line one\\n\\"Line two\\""} count={3} featured image="/images/a.png" theme="info" publishedAt="2026-05-18" />',
      [calloutBlock]
    )

    expect(attrs?.outstaticBlockName).toBe('Callout')
    expect(JSON.parse(attrs?.outstaticBlockDefinition ?? '')).toEqual(
      calloutBlock
    )
    expect(JSON.parse(attrs?.outstaticBlockValues ?? '')).toEqual({
      title: 'A "quoted" & escaped title',
      body: 'Line one\n"Line two"',
      count: '3',
      featured: true,
      image: '/images/a.png',
      theme: 'info',
      publishedAt: '2026-05-18'
    })
  })

  it('preserves default values when MDX omits block props', () => {
    const attrs = getBlockMdxAttributes('<Callout />', [calloutBlock])

    expect(JSON.parse(attrs?.outstaticBlockValues ?? '')).toEqual({
      title: 'Untitled',
      body: '',
      count: '',
      featured: false,
      image: '',
      theme: '',
      publishedAt: ''
    })
  })

  it('loads children into Children props', () => {
    const panelBlock: Block = {
      name: 'Panel',
      props: [
        { name: 'title', type: 'String' },
        { name: 'children', type: 'Children' }
      ]
    }

    const attrs = getBlockMdxAttributes(
      '<Panel title="Hello">\nInner **markdown**\n</Panel>',
      [panelBlock]
    )

    expect(JSON.parse(attrs?.outstaticBlockValues ?? '')).toEqual({
      title: 'Hello',
      children: 'Inner **markdown**'
    })
  })

  it('ignores MDX blocks that are not part of the block library', () => {
    expect(getBlockMdxAttributes('<Unknown />', [calloutBlock])).toBeNull()
    expect(
      getBlockMdxAttributes("import Callout from './Callout'", [calloutBlock])
    ).toBeNull()
  })

  it('keeps same-name MDX raw when props cannot be represented by the UI', () => {
    expect(
      getBlockMdxAttributes('<Callout title={title} />', [calloutBlock])
    ).toBeNull()
    expect(
      getBlockMdxAttributes('<Callout title="Hello" className="wide" />', [
        calloutBlock
      ])
    ).toBeNull()
  })
})

describe('annotateMdxBlocksWithLibraryMetadata', () => {
  it('sets block-library attrs on matching mdxBlock nodes', () => {
    const tr = {
      doc: {
        content: {
          size: 40
        }
      },
      insert: jest.fn(),
      mapping: {
        map: jest.fn((position: number) => position)
      },
      replaceWith: jest.fn()
    }
    const createdNode = { type: { name: 'outstaticMdxBlock' } }
    const editor = {
      state: {
        schema: {
          nodes: {
            outstaticMdxBlock: {
              create: jest.fn(() => createdNode)
            },
            paragraph: {
              create: jest.fn(() => ({ type: { name: 'paragraph' } }))
            }
          }
        },
        tr,
        doc: {
          descendants: jest.fn(
            (callback: (node: any, position: number) => void) => {
              callback(
                {
                  type: {
                    name: 'mdxBlock',
                    create: jest.fn()
                  },
                  attrs: { language: 'mdx' },
                  nodeSize: 28,
                  textContent: '<Callout title="Hello" />'
                },
                4
              )
            }
          )
        }
      },
      view: {
        dispatch: jest.fn()
      }
    } as any

    expect(annotateMdxBlocksWithLibraryMetadata(editor, [calloutBlock])).toBe(
      true
    )
    expect(tr.replaceWith).toHaveBeenCalledWith(4, 32, createdNode)
    expect(tr.insert).not.toHaveBeenCalled()
    expect(editor.view.dispatch).toHaveBeenCalledWith(tr)
  })
})
