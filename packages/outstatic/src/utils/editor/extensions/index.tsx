import StarterKit from '@tiptap/starter-kit'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Image from '@tiptap/extension-image'
import HorizontalRule from '@tiptap/extension-horizontal-rule'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import TiptapUnderline from '@tiptap/extension-underline'
import TextStyle from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Markdown } from 'tiptap-markdown'
import Highlight from '@tiptap/extension-highlight'
import { ReactNodeViewRenderer } from '@tiptap/react'
import lowlight from 'lowlight'
import CodeBlock from './CodeBlock'

import SlashCommand from './slash-command'
import { InputRule } from '@tiptap/core'

export const TiptapExtensions = [
  StarterKit.configure({
    bulletList: {
      HTMLAttributes: {
        class: 'list-disc list-outside leading-3 -mt-2'
      }
    },
    orderedList: {
      HTMLAttributes: {
        class: 'list-decimal list-outside leading-3 -mt-2'
      }
    },
    listItem: {
      HTMLAttributes: {
        class: 'leading-normal -mb-2'
      }
    },
    blockquote: {
      HTMLAttributes: {
        class: 'border-l-4 border-stone-700'
      }
    },
    codeBlock: false,
    code: {
      HTMLAttributes: {
        class:
          'rounded-md bg-stone-200 px-1.5 py-1 font-mono font-medium text-stone-900',
        spellcheck: 'false'
      }
    },
    horizontalRule: false,
    dropcursor: {
      color: '#DBEAFE',
      width: 4
    },
    gapcursor: false
  }),
  // patch to fix horizontal rule bug: https://github.com/ueberdosis/tiptap/pull/3859#issuecomment-1536799740
  HorizontalRule.extend({
    addInputRules() {
      return [
        new InputRule({
          find: /^(?:---|—-|___\s|\*\*\*\s)$/,
          handler: ({ state, range }) => {
            const attributes = {}

            const { tr } = state
            const start = range.from
            let end = range.to

            tr.insert(start - 1, this.type.create(attributes)).delete(
              tr.mapping.map(start),
              tr.mapping.map(end)
            )
          }
        })
      ]
    }
  }).configure({
    HTMLAttributes: {
      class: 'mt-4 mb-6 border-t border-stone-300'
    }
  }),
  Placeholder.configure({
    placeholder: ({ node }) => {
      if (node.type.name === 'heading') {
        return `Heading ${node.attrs.level}`
      }
      return "Press '/' for commands, or '++' for AI autocomplete..."
    },
    includeChildren: true
  }),
  SlashCommand,
  TiptapUnderline,
  TextStyle,
  Color,
  Highlight.configure({
    multicolor: true
  }),
  Markdown.configure({
    html: false,
    transformCopiedText: true
  }),
  Image.extend({
    renderHTML({ HTMLAttributes }) {
      return [
        'img',
        {
          ...HTMLAttributes,
          onError:
            'this.classList.add("image-error");this.alt="Couldn\'t load image.";'
        }
      ]
    }
  }).configure({ inline: true }),
  Link.configure({ openOnClick: false }),
  CodeBlockLowlight.extend({
    addNodeView() {
      return ReactNodeViewRenderer(CodeBlock)
    }
  }).configure({
    lowlight
  })
]
