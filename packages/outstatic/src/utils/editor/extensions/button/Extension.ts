import { Node } from '@tiptap/core'
import { NodeSelection, TextSelection } from '@tiptap/pm/state'
import { ReactNodeViewRenderer } from '@tiptap/react'

import { MarkdownNodeSpec } from 'tiptap-markdown'
import { Component } from './Component'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    reactComponent: {
      setButton: () => ReturnType
    }
  }
}

export default Node.create({
  name: 'ReactComponent',

  group: 'block',

  parseHTML() {
    return [
      {
        tag: 'ReactComponent'
      }
    ]
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: MarkdownNodeSpec) {
          state.write('<ReactComponent />')
          state.closeBlock(node)
        }
      }
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Enter': () => {
        return this.editor
          .chain()
          .insertContentAt(this.editor.state.selection.head, {
            type: this.type.name
          })
          .focus()
          .run()
      }
    }
  },

  renderHTML() {
    return ['ReactComponent']
  },

  addNodeView() {
    return ReactNodeViewRenderer(Component)
  },

  addCommands() {
    return {
      setButton:
        () =>
        ({ chain }) => {
          const currentChain = chain()

          currentChain.insertContent({ type: this.name })

          return (
            currentChain
              // set cursor after button
              .command(({ tr, dispatch }) => {
                if (dispatch) {
                  const { $to } = tr.selection
                  const posAfter = $to.end()

                  if ($to.nodeAfter) {
                    if ($to.nodeAfter.isTextblock) {
                      tr.setSelection(TextSelection.create(tr.doc, $to.pos + 1))
                    } else if ($to.nodeAfter.isBlock) {
                      tr.setSelection(NodeSelection.create(tr.doc, $to.pos))
                    } else {
                      tr.setSelection(TextSelection.create(tr.doc, $to.pos))
                    }
                  } else {
                    // add node after button if it’s the end of the document
                    const node =
                      $to.parent.type.contentMatch.defaultType?.create()

                    if (node) {
                      tr.insert(posAfter, node)
                      tr.setSelection(
                        TextSelection.create(tr.doc, posAfter + 1)
                      )
                    }
                  }

                  tr.scrollIntoView()
                }

                return true
              })
              .run()
          )
        }
    }
  }
})
