import { Extension } from '@tiptap/core'
import { EditorState, Transaction } from '@tiptap/pm/state'

export interface TextAlignOptions {
  types: string[]
  alignments: string[]
  defaultAlignment: string
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    toggleClass: {
      /**
       * Set the text align attribute
       */
      toggleClass: (classs: string) => ReturnType
    }
    addClass: {
      /**
       * Add a class if it doesn't exist
       */
      addClass: (classs: string) => ReturnType
    }
    removeClass: {
      /**
       * Remove a class if it exists
       */
      removeClass: (classs: string) => ReturnType
    }
  }
}

const toggleClass =
  (className: string) =>
  ({ tr, state }: { tr: Transaction; state: EditorState }) => {
    const { selection } = state
    const { $anchor } = selection

    // For simplicity, we're considering a single node. You might want to handle multiple nodes.
    const node = $anchor.node($anchor.depth)

    // Do nothing if no node or if it's a text node
    if (!node || node.isText) {
      return false
    }

    // Determine whether the class already exists on the node
    const classes = node.attrs.class || ''
    const classArray = classes.split(' ')
    const classExists = classArray.includes(className)

    let newClasses
    if (classExists) {
      // Class exists, remove it
      newClasses = classArray
        .filter((item: string) => item !== className)
        .join(' ')
    } else {
      // Class doesn't exist, add it
      newClasses = `${classes} ${className}`.trim()
    }

    // Apply the new class string to the node's attributes
    const newAttrs = { ...node.attrs, class: newClasses }
    tr.setNodeMarkup($anchor.before($anchor.depth), null, newAttrs)

    return true
  }

const addClass =
  (className: string) =>
  ({ tr, state }: { tr: Transaction; state: EditorState }) => {
    const { selection } = state
    const { $anchor } = selection

    const node = $anchor.node($anchor.depth)

    if (!node || node.isText) {
      return false
    }

    const classes = node.attrs.class || ''
    const classArray = classes.split(' ')

    // Only add if class doesn't already exist
    if (!classArray.includes(className)) {
      const newClasses = `${classes} ${className}`.trim()
      const newAttrs = { ...node.attrs, class: newClasses }
      tr.setNodeMarkup($anchor.before($anchor.depth), null, newAttrs)
      return true
    }

    return false
  }

const removeClass =
  (className: string) =>
  ({ tr, state }: { tr: Transaction; state: EditorState }) => {
    const { selection } = state
    const { $anchor } = selection

    const node = $anchor.node($anchor.depth)

    if (!node || node.isText) {
      return false
    }

    const classes = node.attrs.class || ''
    const classArray = classes.split(' ')

    // Only remove if class exists
    if (classArray.includes(className)) {
      const newClasses = classArray
        .filter((item: string) => item !== className)
        .join(' ')
      const newAttrs = { ...node.attrs, class: newClasses }
      tr.setNodeMarkup($anchor.before($anchor.depth), null, newAttrs)
      return true
    }

    return false
  }

export const ToggleClass = Extension.create<TextAlignOptions>({
  name: 'toggleClass',
  addGlobalAttributes() {
    return [
      {
        // Extend the following extensions
        types: ['heading', 'paragraph'],
        // … with those attributes
        attributes: {
          class: {
            default: '',
            // Take the attribute values
            renderHTML: (attributes) => {
              // … and return an object with HTML attributes.
              return {
                class: `${attributes.class}`
              }
            }
          }
        }
      }
    ]
  },

  addCommands() {
    return {
      toggleClass:
        (className: string) =>
        ({ commands }) => {
          return commands.command(toggleClass(className))
        },
      addClass:
        (className: string) =>
        ({ commands }) => {
          return commands.command(addClass(className))
        },
      removeClass:
        (className: string) =>
        ({ commands }) => {
          return commands.command(removeClass(className))
        }
    }
  }
})
