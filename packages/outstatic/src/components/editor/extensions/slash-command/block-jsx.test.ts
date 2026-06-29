import { buildBlockJsx } from './block-jsx'
import { Block } from '@/utils/metadata/types'

describe('buildBlockJsx', () => {
  it('serializes attribute prop types safely', () => {
    const block: Block = {
      name: 'Callout',
      props: [
        { name: 'title', type: 'String' },
        { name: 'body', type: 'Text' },
        { name: 'count', type: 'Number' },
        { name: 'featured', type: 'Boolean' },
        { name: 'image', type: 'Image' },
        { name: 'theme', type: 'Select', options: ['info', 'warn'] },
        { name: 'publishedAt', type: 'Date' }
      ]
    }

    expect(
      buildBlockJsx(block, {
        title: 'A "quoted" & escaped title',
        body: 'Line one\n"Line two"',
        count: '3',
        featured: true,
        image: '/images/a.png',
        theme: 'info',
        publishedAt: '2026-05-18'
      })
    ).toBe(
      '<Callout title={"A \\"quoted\\" & escaped title"} body={"Line one\\n\\"Line two\\""} count={3} featured image="/images/a.png" theme="info" publishedAt="2026-05-18" />'
    )
  })

  it('preserves ampersands in URL-like string props', () => {
    const block: Block = {
      name: 'Youtube',
      props: [{ name: 'url', type: 'String' }]
    }

    expect(
      buildBlockJsx(block, {
        url: 'https://www.youtube.com/watch?v=wxaXWSVhRXU&list=RDwxaXWSVhRXU&start_radio=1'
      })
    ).toBe(
      '<Youtube url="https://www.youtube.com/watch?v=wxaXWSVhRXU&list=RDwxaXWSVhRXU&start_radio=1" />'
    )
  })

  it('omits false booleans and empty optional props', () => {
    const block: Block = {
      name: 'Badge',
      props: [
        { name: 'label', type: 'String' },
        { name: 'featured', type: 'Boolean' }
      ]
    }

    expect(buildBlockJsx(block, { label: '', featured: false })).toBe(
      '<Badge />'
    )
  })

  it('uses children content when a Children prop is filled', () => {
    const block: Block = {
      name: 'Panel',
      props: [
        { name: 'title', type: 'String' },
        { name: 'children', type: 'Children' }
      ]
    }

    expect(
      buildBlockJsx(block, {
        title: 'Hello',
        children: 'Inner **markdown**'
      })
    ).toBe('<Panel title="Hello">\nInner **markdown**\n</Panel>')
  })
})
