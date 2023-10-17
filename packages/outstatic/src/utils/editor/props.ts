import { EditorProps } from '@tiptap/pm/view'
import { addImage } from './utils/addImage'

export const TiptapEditorProps: EditorProps = {
  attributes: {
    class: `prose-lg prose-stone prose-headings:font-display font-default focus:outline-none max-w-full`
  },
  handleDOMEvents: {
    keydown: (_view, event) => {
      // prevent default event listeners from firing when slash command is active
      if (['ArrowUp', 'ArrowDown', 'Enter'].includes(event.key)) {
        const slashCommand = document.querySelector('#slash-command')
        if (slashCommand) {
          return true
        }
      }
    }
  },
  handlePaste: (view, event) => {
    if (
      event.clipboardData &&
      event.clipboardData.files &&
      event.clipboardData.files[0]
    ) {
      event.preventDefault()
      const items = Array.from(event.clipboardData?.items || [])
      for (const item of items) {
        if (item.type.indexOf('image') === 0) {
          const { schema } = view.state
          const file = event.clipboardData.files[0]
          const image = addImage(file)
          const node = schema.nodes.image.create({ src: image, alt: '' })
          const transaction = view.state.tr.replaceSelectionWith(node)
          view.dispatch(transaction)
          return true
        }
      }
    }
    return false
  },
  handleDrop: (view, event, _slice, moved) => {
    if (
      !moved &&
      event.dataTransfer &&
      event.dataTransfer.files &&
      event.dataTransfer.files[0]
    ) {
      event.preventDefault()
      if (event.dataTransfer.files[0] !== undefined) {
        const file = event.dataTransfer.files[0]
        const image = addImage(file)
        const { schema } = view.state
        const node = schema.nodes.image.create({ src: image, alt: '' })
        const transaction = view.state.tr.replaceSelectionWith(node)
        view.dispatch(transaction)
        return true
      }
      return false
    }
  }
}
