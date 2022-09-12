import { ChangeEvent, useContext, useEffect, useState } from 'react'
import { PostContext } from '../../context'
import { FileType } from '../../types'
import Accordion from '../Accordion'
import Input from '../Input'

const PostSettingsCoverImage = () => {
  const { post, editPost, setFiles } = useContext(PostContext)
  const [showCover, setShowCover] = useState(false)
  const [showImageOptions, setShowImageOptions] = useState(false)
  const [showLink, setShowLink] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(true)
  const [loadingError, setLoadingError] = useState(false)
  const [coverImage, setCoverImage] = useState('')

  useEffect(() => {
    const coverImage = post.coverImage?.replace(
      '/images/',
      `/api/outstatic/images/`
    )
    setCoverImage(coverImage || '')
    setShowImageOptions(!post.coverImage)
    setShowCover(!!post.coverImage)
  }, [post.coverImage])

  const addImageFile = async ({
    currentTarget
  }: ChangeEvent<HTMLInputElement>) => {
    if (currentTarget.files?.length && currentTarget.files?.[0] !== null) {
      const file = currentTarget.files[0]
      const blob = URL.createObjectURL(file)
      editPost('coverImage', blob)
      setShowCover(true)
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
    }
  }

  return (
    <Accordion
      title="Cover Image"
      callback={() => post.coverImage || setShowLink(false)}
    >
      {loadingError && (
        <div
          className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800"
          role="alert"
        >
          The image failed to load, try submitting again.
        </div>
      )}
      {showCover && (
        <>
          <div
            className={`w-full relative bg-slate-100 ${
              previewLoading ? 'h-48' : ''
            }`}
          >
            {previewLoading && (
              <div
                className={`animate-pulse w-full h-48 bg-slate-200 absolute`}
              ></div>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverImage}
              className="w-full max-h-48 object-contain"
              onLoad={() => {
                setShowLink(false)
                setPreviewLoading(false)
                setLoadingError(false)
              }}
              onError={() => {
                setPreviewLoading(false)
                setLoadingError(true)
                editPost('coverImage', '')
                setShowLink(false)
              }}
              alt="Cover Image"
            />
          </div>
          <div className="w-full flex justify-between mt-2">
            <button
              onClick={() => {
                editPost('coverImage', '')
                setShowLink(false)
              }}
              className="rounded-lg border border-red-700 bg-red-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-red-800 focus:outline-none"
            >
              Remove
            </button>
          </div>
        </>
      )}
      {showLink && (
        <>
          <Input
            label="Cover Image URL"
            name="coverImage"
            id="coverImage"
            defaultValue={post.coverImage}
            inputSize="small"
            helperText="Remember to save the post after adding the image URL"
            onBlur={(e) => {
              if (e.target.value) {
                setPreviewLoading(true)
                setShowLink(false)
                editPost('coverImage', e.target.value)
              }
            }}
          />
          <div className="w-full flex justify-between mt-2">
            <button
              onClick={() => {
                setShowLink(false)
                setShowImageOptions(true)
              }}
              type="button"
              className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:z-10 focus:outline-none focus:ring-4 focus:ring-blue-300"
            >
              Cancel
            </button>
          </div>
        </>
      )}
      {showImageOptions && (
        <>
          <span className="mb-1 block text-sm font-medium text-gray-900">
            Add an image
          </span>
          <div className="w-full flex justify-between mt-2">
            <button
              onClick={() => {
                setShowLink(true)
                setShowImageOptions(false)
                setShowCover(false)
                setLoadingError(false)
              }}
              type="button"
              className="flex rounded-lg border border-gray-600 bg-gray-800 px-5 py-2.5 text-sm font-medium text-white hover:border-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-700 disabled:cursor-not-allowed disabled:bg-gray-600 md:mb-2"
            >
              From link
            </button>

            <label
              htmlFor="upload-button"
              className="flex cursor-pointer rounded-lg border border-gray-600 bg-gray-800 px-5 py-2.5 text-sm font-medium text-white hover:border-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-700 disabled:cursor-not-allowed disabled:bg-gray-600 md:mb-2"
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
        </>
      )}
    </Accordion>
  )
}

export default PostSettingsCoverImage
