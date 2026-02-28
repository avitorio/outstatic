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
import { Transaction } from '@tiptap/pm/state'

type TableMenuProps = {
  editor: Editor
}

function isInTableFirstRow(tr: Transaction): boolean {
  const { anchor } = tr.selection;
  let activeRow;
  let activeTable;
  tr.doc.descendants((node, pos) => {
    if (node.type.name === "table" && anchor >= pos && anchor <= (pos + node.nodeSize)) {
      activeTable = pos;
    }
    if (node.type.name === "tableRow" && anchor >= pos && anchor <= (pos + node.nodeSize)) {
      activeRow = pos;
    }
  });

  // we are not in a table
  if (activeTable === undefined || activeRow === undefined) {
    return false
  }

  return activeTable + 1 === activeRow;
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
      <div className="flex rounded-md border border-muted bg-background shadow-md transition-all">
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
          onSelect={() => editor.chain().focus().command(({ tr, chain }) => {
            // if we are in first row, we need to toggle header row off first
            if (isInTableFirstRow(tr)) {
              chain().toggleHeaderRow().addRowBefore().toggleHeaderRow();
            } else {
              chain().addRowBefore();
            }

            return true
          }).run()}
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
          onSelect={() => editor.chain().focus().deleteRow().command(({ tr, chain }) => {
            // if we are in first row, that means we deleted the header row
            if (isInTableFirstRow(tr)) {
              chain().toggleHeaderRow();
            }

            return true
          }).run()}
          name="Delete row"
        >
          <ListX size={18} />
        </EditorBubbleButton>
        <EditorBubbleButton
          onSelect={() => editor.chain().focus().toggleHeaderRow().run()}
          name="Toggle Header row"
        >
          <Heading className="text-foreground" size={18} />
        </EditorBubbleButton>
      </div>
    </BubbleMenu>
  )
}

export { TableMenu }
