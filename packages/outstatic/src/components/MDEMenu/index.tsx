import { BubbleMenu, Editor, isTextSelection } from '@tiptap/react'
import { useCallback, useEffect, useState } from 'react'
import { MDEImageMenu } from '..'
import MDEMenuButton from '../MDEMenuButton'

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
      <div className="flex rounded-sm border border-black prose-sm">
        {showLink && (
          <>
            <MDEMenuButton
              onClick={() => {
                setShowLink(false)
              }}
              editor={editor}
              name="back"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="24"
                height="24"
              >
                <path fill="none" d="M0 0h24v24H0z" />
                <path d="M7.828 11H20v2H7.828l5.364 5.364-1.414 1.414L4 12l7.778-7.778 1.414 1.414z" />
              </svg>
            </MDEMenuButton>
            <input
              id="link"
              name="link"
              type="url"
              required
              className="w-[500px] border-r border-black py-2 px-3 outline-none"
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="24"
                height="24"
              >
                <path fill="none" d="M0 0h24v24H0z" />
                <path d="M8 11h4.5a2.5 2.5 0 1 0 0-5H8v5zm10 4.5a4.5 4.5 0 0 1-4.5 4.5H6V4h6.5a4.5 4.5 0 0 1 3.256 7.606A4.498 4.498 0 0 1 18 15.5zM8 13v5h5.5a2.5 2.5 0 1 0 0-5H8z" />
              </svg>
            </MDEMenuButton>
            <MDEMenuButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              editor={editor}
              name="italic"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="24"
                height="24"
              >
                <path fill="none" d="M0 0h24v24H0z" />
                <path d="M15 20H7v-2h2.927l2.116-12H9V4h8v2h-2.927l-2.116 12H15z" />
              </svg>
            </MDEMenuButton>
            <MDEMenuButton
              onClick={() => {
                setUrl(editor.getAttributes('link').href)
                setShowLink(true)
              }}
              editor={editor}
              name="link"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="24"
                height="24"
              >
                <path fill="none" d="M0 0h24v24H0z" />
                <path d="M18.364 15.536L16.95 14.12l1.414-1.414a5 5 0 1 0-7.071-7.071L9.879 7.05 8.464 5.636 9.88 4.222a7 7 0 0 1 9.9 9.9l-1.415 1.414zm-2.828 2.828l-1.415 1.414a7 7 0 0 1-9.9-9.9l1.415-1.414L7.05 9.88l-1.414 1.414a5 5 0 1 0 7.071 7.071l1.414-1.414 1.415 1.414zm-.708-10.607l1.415 1.415-7.071 7.07-1.415-1.414 7.071-7.07z" />
              </svg>
            </MDEMenuButton>

            <MDEMenuButton
              onClick={() => editor.chain().focus().toggleCode().run()}
              editor={editor}
              name="code"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="24"
                height="24"
              >
                <path fill="none" d="M0 0h24v24H0z" />
                <path d="M23 12l-7.071 7.071-1.414-1.414L20.172 12l-5.657-5.657 1.414-1.414L23 12zM3.828 12l5.657 5.657-1.414 1.414L1 12l7.071-7.071 1.414 1.414L3.828 12z" />
              </svg>
            </MDEMenuButton>
            <MDEMenuButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              editor={editor}
              name="heading"
              attributes={{ level: 2 }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M13.4211 20H10.0526V7.36842H5V4H18.4737V7.36842H13.4211V20Z" />
              </svg>
            </MDEMenuButton>
            <MDEMenuButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
              editor={editor}
              name="heading"
              attributes={{ level: 3 }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M13.25 18.875H10.75V9.5H7V7H17V9.5H13.25V18.875Z" />
              </svg>
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="24"
                height="24"
              >
                <path fill="none" d="M0 0h24v24H0z" />
                <path d="M3 3h18a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm1 2v14h16V5H4zm16 7l-3.536 3.536-1.414-1.415L17.172 12 15.05 9.879l1.414-1.415L20 12zM6.828 12l2.122 2.121-1.414 1.415L4 12l3.536-3.536L8.95 9.88 6.828 12zm4.416 5H9.116l3.64-10h2.128l-3.64 10z" />
              </svg>
            </MDEMenuButton>
            <MDEMenuButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              editor={editor}
              name="blockquote"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="24"
                height="24"
              >
                <path fill="none" d="M0 0h24v24H0z" />
                <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
              </svg>
            </MDEMenuButton>
            <MDEMenuButton
              onClick={() => editor.chain().focus().clearNodes().run()}
              editor={editor}
              name="clear"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="24"
                height="24"
              >
                <path fill="none" d="M0 0h24v24H0z" />
                <path d="M18.537 19.567A9.961 9.961 0 0 1 12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10c0 2.136-.67 4.116-1.81 5.74L17 12h3a8 8 0 1 0-2.46 5.772l.997 1.795z" />
              </svg>
            </MDEMenuButton>
          </>
        )}
      </div>
    </BubbleMenu>
  )
}

export default MDEMenu
