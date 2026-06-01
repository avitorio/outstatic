import MarkdownIt from 'markdown-it'
import markdownItMath from './markdown-it-math'

const createMarkdownIt = () => new MarkdownIt().use(markdownItMath)

const getMathTokenContents = (source: string) => {
  const md = createMarkdownIt()
  const inlineToken = md.parseInline(source, {})[0]

  return (inlineToken.children ?? [])
    .filter((token) => token.type === 'math')
    .map((token) => token.content)
}

describe('markdownItMath', () => {
  it('parses inline math between dollar delimiters', () => {
    expect(getMathTokenContents('Solve $x + y$ now')).toEqual(['x + y'])
  })

  it('parses numeric inline math expressions', () => {
    expect(getMathTokenContents('$1 + 2$ equals 3')).toEqual(['1 + 2'])
  })

  it('keeps Brazilian Real amounts as text', () => {
    const source = 'R$1.4 milhoes para o apartamento certo'

    expect(getMathTokenContents(source)).toEqual([])
    expect(createMarkdownIt().renderInline(source)).toBe(source)
  })

  it('does not bridge across repeated currency amounts', () => {
    const source = 'R$1.4 milhoes e R$2.0 milhoes'

    expect(getMathTokenContents(source)).toEqual([])
    expect(createMarkdownIt().renderInline(source)).toBe(source)
  })

  it('does not treat two dollar amounts as one math expression', () => {
    const source = 'Costs $1 and $2 today'

    expect(getMathTokenContents(source)).toEqual([])
    expect(createMarkdownIt().renderInline(source)).toBe(source)
  })
})
