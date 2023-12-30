import remarkMdx from 'remark-mdx'
import remarkParse from 'remark-parse'
import stringify from 'remark-stringify'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'
import { API_IMAGES_PATH, IMAGES_PATH } from './constants'

// Define a type for the JSX node
interface MdxJsxFlowElement {
  type: 'mdxJsxFlowElement'
  name: string
  attributes: Array<any>
  children: Array<any>
}
export const parseContent = (content: string) => {
  // Prepare regex
  let regex = new RegExp(
    `(\\!\\[[^\\]]*\\]\\()/${IMAGES_PATH.replace(/\//g, '\\/')}([^)]+)`,
    'g'
  )

  // Replace the path for image files in Markdown image syntax, regardless of file format
  let result = content.replace(regex, `$1/${API_IMAGES_PATH}$2`)

  // Convert self-closing tags to open and close tags
  return transformMdxContent(result)
}

export function transformMdxContent(mdxContent: string): string {
  const processor = unified()
    .use(remarkParse)
    .use(remarkMdx)
    .use(() => (tree) => {
      visit(tree, 'mdxJsxFlowElement', (node: MdxJsxFlowElement) => {
        if (node.children.length === 0) {
          // Add an empty children array to represent an opening and closing tag
          node.children = [
            {
              type: 'text',
              value: ''
            }
          ]
        }
      })
    })
    .use(stringify)

  return processor.processSync(mdxContent).toString()
}
