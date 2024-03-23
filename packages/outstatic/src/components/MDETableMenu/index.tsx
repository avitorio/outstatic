import MDEMenuButton from '@/components/MDEMenuButton'
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

type MDETableMenuProps = {
  editor: Editor
}

const MDETableMenu = ({ editor }: MDETableMenuProps) => {
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
        <MDEMenuButton
          onClick={() => editor.chain().focus().addColumnBefore().run()}
          editor={editor}
          name="Add column before"
        >
          <PanelLeftClose size={18} />
        </MDEMenuButton>
        <MDEMenuButton
          onClick={() => editor.chain().focus().addColumnAfter().run()}
          editor={editor}
          name="Add column after"
        >
          <PanelRightClose size={18} />
        </MDEMenuButton>

        <MDEMenuButton
          onClick={() => editor.chain().focus().deleteColumn().run()}
          editor={editor}
          name="Delete column"
        >
          <ListX size={18} className="-rotate-90" />
        </MDEMenuButton>

        <MDEMenuButton
          onClick={() => editor.chain().focus().addRowBefore().run()}
          editor={editor}
          name="Add row before"
        >
          <PanelTopCloseIcon size={18} />
        </MDEMenuButton>
        <MDEMenuButton
          onClick={() => editor.chain().focus().addRowAfter().run()}
          editor={editor}
          name="Add row after"
        >
          <PanelBottomClose size={18} />
        </MDEMenuButton>
        <MDEMenuButton
          onClick={() => editor.chain().focus().deleteRow().run()}
          editor={editor}
          name="Delete row"
        >
          <ListX size={18} />
        </MDEMenuButton>
        <MDEMenuButton
          onClick={() => editor.chain().focus().toggleHeaderRow().run()}
          editor={editor}
          name="Toggle Header row"
        >
          <Heading size={18} />
        </MDEMenuButton>
      </div>
    </BubbleMenu>
  )
}

export default MDETableMenu
