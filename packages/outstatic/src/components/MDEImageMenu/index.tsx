import { Editor } from '@tiptap/react'
import { useCallback, useContext, useState } from 'react'
import { PostContext } from '../../context'
import MDEMenuButton from '../MDEMenuButton'

type MDEUImageMenuProps = {
  editor: Editor
  setImageSelected: (value: boolean) => void
}

const MDEUImageMenu = ({ editor, setImageSelected }: MDEUImageMenuProps) => {
  const { setFiles } = useContext(PostContext)
  const [showLink, setShowLink] = useState(false)
  const [url, setUrl] = useState('')
  const [showAltText, setShowAltText] = useState(false)
  const [altText, setAltText] = useState('')

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

  const addAltText = useCallback(() => {
    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .unsetLink()
      .updateAttributes('image', {
        alt: altText
      })
      .setLink({ href: editor.getAttributes('link').href })
      .run()

    setShowAltText(false)
    setImageSelected(true)
    editor.chain().blur().run()
    setUrl('')
    setAltText('')
  }, [editor, altText, setImageSelected])

  const removeImage = () => {
    const blob = editor.getAttributes('image').src
    setFiles((oldState) => {
      return oldState.filter((file) => {
        return file.blob !== blob
      })
    })
    editor.chain().focus().deleteSelection().run()
    setImageSelected(false)
  }

  return (
    <>
      {showAltText && (
        <>
          <MDEMenuButton
            onClick={() => {
              setShowAltText(false)
              setImageSelected(true)
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
            id="alt-text"
            name="alt-text"
            required
            className="w-[500px] border-r border-black py-2 px-3 outline-none"
            placeholder="Insert alt text here"
            onChange={(e) => {
              setAltText(e.target.value.trim())
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                addAltText()
              }
              if (e.key === 'Escape') {
                setShowAltText(false)
                setImageSelected(true)
              }
            }}
            defaultValue={altText}
            autoFocus
          />
          <MDEMenuButton onClick={addAltText} editor={editor} name="addAltText">
            Done
          </MDEMenuButton>
        </>
      )}
      {showLink && (
        <>
          <MDEMenuButton
            onClick={() => {
              if (editor.isActive('image')) {
                setImageSelected(true)
              }
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
      {!showAltText && !showLink && (
        <>
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
            onClick={() => {
              setAltText(editor.getAttributes('image').alt)
              setShowAltText(true)
            }}
            editor={editor}
            name="image"
            attributes={
              editor.getAttributes('image').alt
                ? { alt: editor.getAttributes('image').alt }
                : { alt: false }
            }
          >
            Alt Text
          </MDEMenuButton>
          <MDEMenuButton
            onClick={removeImage}
            editor={editor}
            name="remove-image"
          >
            Remove Image
          </MDEMenuButton>
        </>
      )}
    </>
  )
}

export default MDEUImageMenu
