import { Editor, FloatingMenu } from '@tiptap/react'
import { useState } from 'react'
import MDEInsertImage from '../MDEInsertImage'
import MDEMenuButton from '../MDEMenuButton'

type MDEFloatingMenuProps = {
  editor: Editor
}

const MDEFloatingMenu = ({ editor }: MDEFloatingMenuProps) => {
  const [imageMenu, setImageMenu] = useState(false)

  return (
    <>
      <FloatingMenu
        editor={editor}
        tippyOptions={{
          duration: 100,
          onHidden: () => setImageMenu(false),
          offset: () => (editor.isEmpty ? [0, 180] : [0, 10])
        }}
        className="prose-sm"
      >
        {!imageMenu ? (
          <div className="rounded-sm border border-black">
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
              onClick={() => setImageMenu(true)}
              editor={editor}
              name="image"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="24"
                height="24"
              >
                <path fill="none" d="M0 0h24v24H0z" />
                <path d="M4.828 21l-.02.02-.021-.02H2.992A.993.993 0 0 1 2 20.007V3.993A1 1 0 0 1 2.992 3h18.016c.548 0 .992.445.992.993v16.014a1 1 0 0 1-.992.993H4.828zM20 15V5H4v14L14 9l6 6zm0 2.828l-6-6L6.828 19H20v-1.172zM8 11a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
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
          </div>
        ) : (
          <MDEInsertImage editor={editor} setImageMenu={setImageMenu} />
        )}
      </FloatingMenu>
    </>
  )
}

export default MDEFloatingMenu
