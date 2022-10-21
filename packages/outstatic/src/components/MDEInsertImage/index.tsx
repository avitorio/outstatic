import { Editor } from '@tiptap/react'
import { ChangeEvent, useCallback, useContext, useState } from 'react'
import { DocumentContext } from '../../context'
import { FileType } from '../../types'
import MDEMenuButton from '../MDEMenuButton'

type MDEInsertImageProps = {
  editor: Editor
  setImageMenu: (value: boolean) => void
}

const isValidUrl = (urlString: string) => {
  try {
    return Boolean(new URL(urlString))
  } catch (e) {
    return false
  }
}

const MDEInsertImage = ({ editor, setImageMenu }: MDEInsertImageProps) => {
  const { setFiles } = useContext(DocumentContext)
  const [showLink, setShowLink] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [errors, setErrors] = useState({ imageUrl: '', uploadImage: '' })

  const addImageFile = async ({
    currentTarget
  }: ChangeEvent<HTMLInputElement>) => {
    if (currentTarget.files?.length && currentTarget.files?.[0] !== null) {
      const file = currentTarget.files[0]
      const blob = URL.createObjectURL(file)
      editor.chain().focus().setImage({ src: blob, alt: '' }).run()
      const reader = new FileReader()
      reader.readAsArrayBuffer(file)
      reader.onloadend = () => {
        const bytes = reader.result as string
        const buffer = Buffer.from(bytes, 'binary')
        setFiles((files: FileType[]) => [
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

  const addImageUrl = useCallback(async () => {
    if (!isValidUrl(imageUrl)) {
      setErrors((oldState) => ({ ...oldState, imageUrl: 'Invalid URL' }))
      return null
    }

    if (imageUrl) {
      // TODO: Jump to new paragraph after adding image
      editor
        .chain()
        .focus()
        .setImage({ src: imageUrl, alt: '', title: 'an-image-title' })
        .insertContent('')
        .run()
      editor.chain().blur().run()
    }
    setShowLink(false)
  }, [editor, imageUrl])

  return (
    <>
      {showLink ? (
        <div className="flex w-[500px] rounded-sm border border-black outline-none">
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
            >
              <path fill="none" d="M0 0h24v24H0z" />
              <path d="M7.828 11H20v2H7.828l5.364 5.364-1.414 1.414L4 12l7.778-7.778 1.414 1.414z" />
            </svg>
          </MDEMenuButton>
          <div
            className={`relative w-[500px] border-r outline-none border-black`}
          >
            <input
              type="text"
              className={`w-full h-full py-2 px-3 outline-none ${
                errors.imageUrl ? 'bg-red-50' : 'bg-white'
              }`}
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
              onFocus={() => setErrors({ ...errors, imageUrl: '' })}
              autoFocus
            />
            {errors.imageUrl && (
              <span className="absolute text-red-500 top-10 left-0">
                {errors.imageUrl}
              </span>
            )}
          </div>
          <MDEMenuButton onClick={addImageUrl} editor={editor} name="back">
            Done
          </MDEMenuButton>
        </div>
      ) : (
        <div className="flex rounded-sm border border-black outline-none">
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
            className="group cursor-pointer border-l border-black py-2 px-3 last-of-type:border-r-0 disabled:cursor-not-allowed disabled:hover:bg-gray-600 hover:bg-slate-100"
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

export default MDEInsertImage
