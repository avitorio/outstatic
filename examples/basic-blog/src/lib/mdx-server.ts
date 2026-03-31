import { bundleMDX } from 'mdx-bundler'
import rehypePrettyCode from 'rehype-pretty-code'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

export default async function MDXServer(code: string) {
  const result = await bundleMDX({
    source: code,
    mdxOptions(options) {
      options.remarkPlugins = options.remarkPlugins ?? []
      options.remarkPlugins.push(remarkGfm as any)
      options.remarkPlugins.push(remarkMath as any)
      options.rehypePlugins = options.rehypePlugins ?? []
      options.rehypePlugins.push(rehypeKatex as any)
      options.rehypePlugins.push([
        rehypePrettyCode as any,
        {
          theme: 'dracula' // Add other rehypePrettyCode options if necessary
        }
      ])

      return options
    }
  })

  return result.code
}
