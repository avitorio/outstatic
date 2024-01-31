import MDEMenuButton from '@/components/MDEMenuButton'
import { BubbleMenu, Editor, isTextSelection } from '@tiptap/react'
import {
  ArrowLeft,
  Bold,
  Code2,
  Heading2,
  Heading3,
  Italic,
  Link,
  Terminal,
  TextQuote,
  Undo2
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { MDEImageMenu } from '..'

type MDEMenuProps = {
  editor: Editor
}
const MDEMenu = ({ editor }: MDEMenuProps) => {
  const [imageSelected, setImageSelected] = useState(false)
  const [showLink, setShowLink] = useState(false)
  const [url, setUrl] = useState('')

  const setLink = useCallback(() => {
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()

    // empty
    if (url === '' || url === undefined) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    }
    setShowLink(false)
    editor.chain().blur().run()
    setUrl('')
  }, [editor, url])

  useEffect(() => {
    const activeImage = () => {
      if (editor.isActive('image')) {
        setImageSelected(true)
      }
    }
    editor.on('selectionUpdate', activeImage)
    editor.on('focus', activeImage)
  }, [editor])

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{
        duration: 100,
        maxWidth: 500,
        onHidden: () => {
          setImageSelected(false)
          setShowLink(false)
        }
      }}
      shouldShow={({ editor, view, state, from, to }) => {
        // extended from @tiptap/extension-bubble-menu/src/bubble-menu-plugin.ts
        const { doc, selection } = state
        const { empty } = selection
        const isEmptyTextBlock =
          !doc.textBetween(from, to).length && isTextSelection(state.selection)

        if (
          !view.hasFocus() ||
          empty ||
          isEmptyTextBlock ||
          editor.isActive('codeBlock')
        ) {
          return false
        }

        return true
      }}
    >
      <div className="flex prose-sm rounded-md border border-stone-200 bg-white shadow-md transition-all">
        {showLink && (
          <>
            <MDEMenuButton
              onClick={() => {
                setShowLink(false)
              }}
              editor={editor}
              name="back"
            >
              <ArrowLeft size={18} />
            </MDEMenuButton>
            <input
              id="link"
              name="link"
              type="url"
              required
              className="w-[500px] border-r border-slate-200 py-2 px-3 outline-none"
              placeholder="Insert link here"
              onChange={(e) => {
                setUrl(e.target.value.trim())
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setLink()
                }
                if (e.key === 'Escape') {
                  setShowLink(false)
                }
              }}
              autoFocus
              defaultValue={url}
            />
            <MDEMenuButton onClick={setLink} editor={editor} name="submitLink">
              Done
            </MDEMenuButton>
          </>
        )}
        {imageSelected && (
          <MDEImageMenu editor={editor} setImageSelected={setImageSelected} />
        )}
        {!imageSelected && !showLink && (
          <>
            <MDEMenuButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              editor={editor}
              name="bold"
            >
              <Bold size={18} />
            </MDEMenuButton>
            <MDEMenuButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              editor={editor}
              name="italic"
            >
              <Italic size={18} />
            </MDEMenuButton>
            <MDEMenuButton
              onClick={() => {
                setUrl(editor.getAttributes('link').href)
                setShowLink(true)
              }}
              editor={editor}
              name="link"
            >
              <Link size={18} />
            </MDEMenuButton>

            <MDEMenuButton
              onClick={() => editor.chain().focus().toggleCode().run()}
              editor={editor}
              name="code"
            >
              <Terminal size={18} />
            </MDEMenuButton>
            <MDEMenuButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              editor={editor}
              name="heading"
              attributes={{ level: 2 }}
            >
              <Heading2 size={18} />
            </MDEMenuButton>
            <MDEMenuButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
              editor={editor}
              name="heading"
              attributes={{ level: 3 }}
            >
              <Heading3 size={18} />
            </MDEMenuButton>
            <MDEMenuButton
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .toggleCodeBlock({ language: 'javascript' })
                  .run()
              }
              editor={editor}
              name="codeBlock"
            >
              <Code2 size={18} />
            </MDEMenuButton>
            <MDEMenuButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              editor={editor}
              name="blockquote"
            >
              <TextQuote size={18} />
            </MDEMenuButton>
            <MDEMenuButton
              onClick={() => editor.chain().focus().clearNodes().run()}
              editor={editor}
              name="clear"
            >
              <Undo2 size={18} />
            </MDEMenuButton>
          </>
        )}
      </div>
    </BubbleMenu>
  )
}

export default MDEMenu
