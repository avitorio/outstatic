import { mergeAttributes } from '@tiptap/core'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { ReactNodeViewRenderer } from '@tiptap/react'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type MarkdownIt from 'markdown-it'
import { MdxBlockView } from './mdx-block-view'
import { plainLowlight } from './mdx-lowlight'
import { markdownItMdxBlock } from './mdx-parser'
import { MDX_BLOCK_TYPE } from './mdx-block-utils'

type MarkdownSerializerState = {
  write: (content: string) => void
  closeBlock: (node: ProseMirrorNode) => void
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mdxBlock: {
      setMdxBlock: (attributes?: { raw?: string }) => ReturnType
    }
  }
}

export const MdxBlock = CodeBlockLowlight.extend({
  name: MDX_BLOCK_TYPE,
  // Keep this ahead of the base code block so MDX nodes rehydrate before generic code blocks.
  priority: 1000,

  addOptions() {
    return {
      ...this.parent?.(),
      lowlight: plainLowlight,
      defaultLanguage: 'mdx'
    }
  },

  parseHTML() {
    return [
      {
        tag: `pre[data-type="${MDX_BLOCK_TYPE}"]`,
        preserveWhitespace: 'full'
      }
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'pre',
      mergeAttributes(HTMLAttributes, {
        'data-type': MDX_BLOCK_TYPE
      }),
      ['code', 0]
    ]
  },

  addCommands() {
    return {
      setMdxBlock:
        (attributes = {}) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            content: attributes.raw
              ? [
                  {
                    type: 'text',
                    text: attributes.raw
                  }
                ]
              : []
          })
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxBlockView)
  },

  addStorage() {
    return {
      markdown: {
        serialize: (state: MarkdownSerializerState, node: ProseMirrorNode) => {
          state.write(node.textContent)
          state.closeBlock(node)
        },
        parse: {
          setup(markdownit: MarkdownIt) {
            markdownit.use(markdownItMdxBlock)
          }
        }
      }
    }
  }
})
