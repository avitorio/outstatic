import { mergeAttributes, Node } from '@tiptap/core'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { NodeSelection, Plugin, PluginKey } from '@tiptap/pm/state'
import { ReactNodeViewRenderer } from '@tiptap/react'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type MarkdownIt from 'markdown-it'
import { MdxBlockView } from './mdx-block-view'
import { plainLowlight } from './mdx-lowlight'
import { markdownItMdxBlock } from './mdx-parser'
import { MDX_BLOCK_TYPE } from './mdx-block-utils'
import { getSerializedMdxBlock } from './mdx-block-serialization'

export const OUTSTATIC_MDX_BLOCK_TYPE = 'outstaticMdxBlock'

type MarkdownSerializerState = {
  write: (content: string) => void
  closeBlock: (node: ProseMirrorNode) => void
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mdxBlock: {
      setMdxBlock: (attributes?: {
        raw?: string
        outstaticBlockName?: string
        outstaticBlockValues?: string
        outstaticBlockDefinition?: string
        outstaticBlockFocusKey?: string
      }) => ReturnType
    }
  }
}

const outstaticBlockAttributes = {
  outstaticBlockName: {
    default: null,
    parseHTML: (element: HTMLElement) =>
      element.getAttribute('data-outstatic-block-name'),
    renderHTML: (attributes: Record<string, string | null>) =>
      attributes.outstaticBlockName
        ? {
            'data-outstatic-block-name': attributes.outstaticBlockName
          }
        : {}
  },
  outstaticBlockValues: {
    default: null,
    parseHTML: (element: HTMLElement) =>
      element.getAttribute('data-outstatic-block-values'),
    renderHTML: (attributes: Record<string, string | null>) =>
      attributes.outstaticBlockValues
        ? {
            'data-outstatic-block-values': attributes.outstaticBlockValues
          }
        : {}
  },
  outstaticBlockDefinition: {
    default: null,
    parseHTML: (element: HTMLElement) =>
      element.getAttribute('data-outstatic-block-definition'),
    renderHTML: (attributes: Record<string, string | null>) =>
      attributes.outstaticBlockDefinition
        ? {
            'data-outstatic-block-definition':
              attributes.outstaticBlockDefinition
          }
        : {}
  },
  outstaticBlockFocusKey: {
    default: null,
    parseHTML: () => null,
    renderHTML: () => ({})
  }
}

export const OutstaticMdxBlock = Node.create({
  name: OUTSTATIC_MDX_BLOCK_TYPE,
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  parseHTML() {
    return [
      {
        tag: `div[data-type="${OUTSTATIC_MDX_BLOCK_TYPE}"]`
      }
    ]
  },

  addAttributes() {
    return outstaticBlockAttributes
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': OUTSTATIC_MDX_BLOCK_TYPE
      })
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxBlockView)
  },

  addStorage() {
    return {
      markdown: {
        serialize: (state: MarkdownSerializerState, node: ProseMirrorNode) => {
          state.write(getSerializedMdxBlock(node) ?? '')
          state.closeBlock(node)
        }
      }
    }
  }
})

export const MdxBlock = CodeBlockLowlight.extend({
  name: MDX_BLOCK_TYPE,
  // CodeBlockLowlight uses Tiptap's default priority (100). Keep MDX higher so
  // pre[data-type="mdxBlock"] rehydrates before the generic code block parser.
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

  addAttributes() {
    return {
      ...this.parent?.(),
      ...outstaticBlockAttributes
    }
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
        ({ commands }) => {
          const isOutstaticBlock = Boolean(attributes.outstaticBlockName)
          const mdxBlock = {
            type: isOutstaticBlock ? OUTSTATIC_MDX_BLOCK_TYPE : this.name,
            attrs: {
              outstaticBlockName: attributes.outstaticBlockName ?? null,
              outstaticBlockValues: attributes.outstaticBlockValues ?? null,
              outstaticBlockDefinition:
                attributes.outstaticBlockDefinition ?? null,
              outstaticBlockFocusKey: attributes.outstaticBlockFocusKey ?? null
            },
            content:
              attributes.raw && !isOutstaticBlock
                ? [
                    {
                      type: 'text',
                      text: attributes.raw
                    }
                  ]
                : []
          }

          return commands.insertContent(mdxBlock)
        }
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxBlockView)
  },

  addProseMirrorPlugins() {
    return [
      ...(this.parent?.() ?? []),
      new Plugin({
        key: new PluginKey('mdxBlockPasteHandler'),
        props: {
          handlePaste: (view, event) => {
            const text = event.clipboardData?.getData('text/plain')

            if (!text) {
              return false
            }

            const { selection, schema } = view.state
            const normalizedText = text.replace(/\r\n?/g, '\n')
            const textNode = schema.text(normalizedText)
            const transaction = view.state.tr

            if (
              selection.$from.parent.type === this.type &&
              selection.$from.sameParent(selection.$to)
            ) {
              transaction.replaceSelectionWith(textNode, true)
            } else if (
              selection instanceof NodeSelection &&
              selection.node.type === this.type
            ) {
              transaction.replaceSelectionWith(this.type.create(null, textNode))
            } else {
              return false
            }

            transaction.setMeta('paste', true)
            transaction.setMeta('uiEvent', 'paste')
            view.dispatch(transaction.scrollIntoView())

            return true
          }
        }
      })
    ]
  },

  addStorage() {
    return {
      markdown: {
        serialize: (state: MarkdownSerializerState, node: ProseMirrorNode) => {
          state.write(getSerializedMdxBlock(node) ?? node.textContent)
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
