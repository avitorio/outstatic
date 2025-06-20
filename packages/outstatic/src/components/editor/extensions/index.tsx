import { AnyExtension, InputRule } from '@tiptap/core'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Highlight from '@tiptap/extension-highlight'
import HorizontalRule from '@tiptap/extension-horizontal-rule'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Table from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import TiptapUnderline from '@tiptap/extension-underline'
import { ReactNodeViewRenderer } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { common, createLowlight } from 'lowlight'
import { Markdown } from 'tiptap-markdown'
import CodeBlock from '@/components/editor/extensions/code-block'
import SlashCommand from '@/components/editor/extensions/slash-command'
import { ToggleClass } from '@/components/editor/extensions/toggle-class'
import { Mathematics } from '@/components/editor/extensions/mathematics'
import { AIHighlight } from 'novel/extensions'
import { cn } from '@/utils/ui'

export const TiptapExtensions = [
  AIHighlight,
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
        class: 'border-l-4 border-muted'
      }
    },
    codeBlock: false,
    code: {
      HTMLAttributes: {
        class:
          'rounded-md bg-muted px-1.5 py-1 font-mono font-medium text-foreground',
        spellcheck: 'false'
      }
    },
    horizontalRule: false,
    dropcursor: {
      color: '#DBEAFE',
      width: 4
    }
  }),
  ToggleClass,
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

            // @ts-ignore
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
      class: 'mt-4 mb-6 border-t border-muted'
    }
  }),
  SlashCommand,
  TiptapUnderline,
  Highlight.configure({
    multicolor: true
  }),
  Markdown.configure({
    html: false,
    linkify: false,
    transformPastedText: true
  }),
  Mathematics.configure({
    HTMLAttributes: {
      class: cn('text-foreground rounded p-1 hover:bg-accent cursor-pointer')
    },
    katexOptions: {
      throwOnError: false
    }
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
      return ReactNodeViewRenderer(CodeBlock as any)
    }
  }).configure({
    // configure lowlight: common /  all / use highlightJS in case there is a need to specify certain language grammars only
    // common: covers 37 language grammars which should be good enough in most cases
    lowlight: createLowlight(common)
  }),
  Table.configure({
    resizable: true
  }),
  TableRow,
  TableHeader,
  TableCell
] as AnyExtension[] // TODO: fix this type
