import { bundleMDX } from 'mdx-bundler'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypePrettyCode from 'rehype-pretty-code'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'

export default async function MDXServer(code: string) {
  const result = await bundleMDX({
    source: code,
    mdxOptions(options) {
      options.remarkPlugins = options.remarkPlugins ?? []
      options.remarkPlugins.push(remarkGfm as any)

      options.rehypePlugins = options.rehypePlugins ?? []
      options.rehypePlugins.push(rehypeSlug as any)
      options.rehypePlugins.push([
        rehypePrettyCode as any,
        {
          theme: 'dracula' // Add other rehypePrettyCode options if necessary
        }
      ])
      options.rehypePlugins.push([
        rehypeAutolinkHeadings as any,
        {
          properties: {
            className: ['hash-anchor']
          }
        }
      ])

      return options
    }
  })

  return result.code
}
