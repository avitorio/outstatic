import { Editor } from '@tiptap/react'
import { ChangeEvent, useCallback, useContext, useState } from 'react'
import { PostContext } from '../../context'
import { FileType } from '../../types'
import MDEMenuButton from '../MDEMenuButton'

type MDEUploadImageMenuProps = {
  editor: Editor
  setImageMenu: (value: boolean) => void
}

const MDEUploadImageMenu = ({
  editor,
  setImageMenu
}: MDEUploadImageMenuProps) => {
  const context = useContext(PostContext)
  const [showLink, setShowLink] = useState(false)
  const [imageUrl, setImageUrl] = useState('')

  const addImageFile = async ({
    currentTarget
  }: ChangeEvent<HTMLInputElement>) => {
    if (currentTarget.files?.length && currentTarget.files?.[0] !== null) {
      const file = currentTarget.files[0]
      const blob = URL.createObjectURL(file)
      editor.chain().focus().setImage({ src: blob }).run()
      const reader = new FileReader()
      reader.readAsArrayBuffer(file)
      reader.onloadend = () => {
        const bytes = reader.result as string
        const buffer = Buffer.from(bytes, 'binary')
        context?.setFiles((files: FileType[]) => [
          ...files,
          {
            type: 'images',
            blob,
            filename: file.name,
            content: buffer.toString('base64')
          }
        ])
      }
      editor.chain().blur().run()
    }
  }

  const handleImageInput = (e: ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value)
  }

  const addImageUrl = useCallback(() => {
    if (imageUrl) {
      // TODO: Jump to new paragraph after adding image
      editor
        .chain()
        .focus()
        .setImage({ src: imageUrl, alt: '' })
        .insertContent('')
        .run()
      editor.chain().blur().run()
    }
    setShowLink(false)
  }, [editor, imageUrl])

  return (
    <>
      {showLink ? (
        <div className="flex w-[500px] rounded-sm border border-black">
          <MDEMenuButton
            onClick={() => setShowLink(false)}
            editor={editor}
            name="back"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24"
              height="24"
              className="group-hover:fill-white"
            >
              <path fill="none" d="M0 0h24v24H0z" />
              <path d="M7.828 11H20v2H7.828l5.364 5.364-1.414 1.414L4 12l7.778-7.778 1.414 1.414z" />
            </svg>
          </MDEMenuButton>
          <input
            type="text"
            className="w-[500px] border-r border-black py-2 px-3 outline-none"
            placeholder="Insert link here"
            onChange={handleImageInput}
            value={imageUrl}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                addImageUrl()
              }
              if (e.key === 'Escape') {
                setShowLink(false)
              }
            }}
            autoFocus
          />

          <MDEMenuButton onClick={addImageUrl} editor={editor} name="back">
            Done
          </MDEMenuButton>
        </div>
      ) : (
        <div className="flex rounded-sm border border-black">
          <MDEMenuButton
            onClick={() => setImageMenu(false)}
            editor={editor}
            name="back"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24"
              height="24"
              className="group-hover:fill-white"
            >
              <path fill="none" d="M0 0h24v24H0z" />
              <path d="M7.828 11H20v2H7.828l5.364 5.364-1.414 1.414L4 12l7.778-7.778 1.414 1.414z" />
            </svg>
          </MDEMenuButton>
          <MDEMenuButton
            onClick={() => setShowLink(true)}
            editor={editor}
            name="imageFromLink"
          >
            From link
          </MDEMenuButton>

          <label
            htmlFor="upload-button"
            className="group cursor-pointer border-l border-black py-2 px-3 last-of-type:border-r-0 text-black hover:bg-black hover:text-white"
          >
            From file
          </label>
          <input
            type="file"
            accept="image/*"
            id="upload-button"
            onChange={addImageFile}
            className="hidden"
          />
        </div>
      )}
    </>
  )
}

export default MDEUploadImageMenu