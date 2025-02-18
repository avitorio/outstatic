import { BubbleMenu, Editor } from '@tiptap/react'
import {
  Heading,
  ListX,
  PanelBottomClose,
  PanelLeftClose,
  PanelRightClose,
  PanelTopCloseIcon
} from 'lucide-react'
import { useCallback } from 'react'
import { EditorBubbleButton } from '../ui/editor-bubble-button'

type TableMenuProps = {
  editor: Editor
}

const TableMenu = ({ editor }: TableMenuProps) => {
  const shouldShow = useCallback(() => {
    return (
      (editor.isActive('tableCell') || editor.isActive('tableHeader')) &&
      editor.view.state.selection.empty
    )
  }, [editor])

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={shouldShow}
      tippyOptions={{
        duration: 100,
        maxWidth: 500
      }}
    >
      <div className="flex prose-sm rounded-md border border-stone-200 bg-white shadow-md transition-all">
        <EditorBubbleButton
          onSelect={() => editor.chain().focus().addColumnBefore().run()}
          name="Add column before"
        >
          <PanelLeftClose size={18} />
        </EditorBubbleButton>
        <EditorBubbleButton
          onSelect={() => editor.chain().focus().addColumnAfter().run()}
          name="Add column after"
        >
          <PanelRightClose size={18} />
        </EditorBubbleButton>

        <EditorBubbleButton
          onSelect={() => editor.chain().focus().deleteColumn().run()}
          name="Delete column"
        >
          <ListX size={18} className="-rotate-90" />
        </EditorBubbleButton>

        <EditorBubbleButton
          onSelect={() => editor.chain().focus().addRowBefore().run()}
          name="Add row before"
        >
          <PanelTopCloseIcon size={18} />
        </EditorBubbleButton>
        <EditorBubbleButton
          onSelect={() => editor.chain().focus().addRowAfter().run()}
          name="Add row after"
        >
          <PanelBottomClose size={18} />
        </EditorBubbleButton>
        <EditorBubbleButton
          onSelect={() => editor.chain().focus().deleteRow().run()}
          name="Delete row"
        >
          <ListX size={18} />
        </EditorBubbleButton>
        <EditorBubbleButton
          onSelect={() => editor.chain().focus().toggleHeaderRow().run()}
          name="Toggle Header row"
        >
          <Heading size={18} />
        </EditorBubbleButton>
      </div>
    </BubbleMenu>
  )
}

export { TableMenu }
