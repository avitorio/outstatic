import MDEMenuButton from '@/components/MDEMenuButton'
import {
  CommandItemProps,
  updateScrollView
} from '@/utils/editor/extensions/SlashCommand'
import { Editor, Range } from '@tiptap/react'
import { Image, Link, Upload } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { addImage } from '../addImage'
import MediaLibraryModal from '@/components/ui/outstatic/media-library-modal'
import { API_MEDIA_PATH } from '@/utils/constants'

type ImageCommandListProps = {
  editor: Editor
  setImageMenu: (value: boolean) => void
  range: Range
}

const isValidUrl = (urlString: string) => {
  try {
    return Boolean(new URL(urlString))
  } catch (e) {
    return false
  }
}

const items = [
  {
    title: 'Image Upload',
    description: 'Upload image from file.',
    searchTerms: ['upload', 'picture', 'media'],
    icon: <Upload size={18} />
  },
  {
    title: 'Image from URL',
    description: 'Embed with a link.',
    searchTerms: ['photo', 'picture', 'media'],
    icon: <Link size={18} />
  },
  {
    title: 'Media Gallery',
    description: 'Add image from media gallery.',
    searchTerms: ['photo', 'picture', 'media'],
    icon: <Image size={18} />
  }
]

const ImageCommandList = ({
  editor,
  range,
  setImageMenu
}: ImageCommandListProps) => {
  const [showLink, setShowLink] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [showMediaLibrary, setShowMediaLibrary] = useState(false)
  const [errors, setErrors] = useState({ imageUrl: '', uploadImage: '' })
  const [selectedIndex, setSelectedIndex] = useState(0)

  const handleItemAction = (title: string) => {
    switch (title) {
      case 'Image Upload':
        addImageFile()
        break
      case 'Image from URL':
        setShowLink(true)
        break
      case 'Media Gallery':
        setShowMediaLibrary(true)
        break
      // Add more cases for future actions
      default:
        console.warn(`Unhandled action: ${title}`)
    }
  }

  const addImageFile = async () => {
    editor.chain().focus().deleteRange(range).run()
    // upload image
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      if (input.files?.length) {
        const file = input.files[0]
        const image = addImage(file)
        if (image) {
          editor.chain().focus().setImage({ src: image, alt: '' }).run()
        }
      }
    }
    input.click()
  }

  const addImageUrl = (imageUrl: string) => {
    if (!imageUrl.startsWith(API_MEDIA_PATH) && !isValidUrl(imageUrl)) {
      setErrors((prevErrors) => ({ ...prevErrors, imageUrl: 'Invalid URL' }))
      return null
    }

    if (imageUrl) {
      // TODO: Jump to new paragraph after adding image
      editor.chain().focus().deleteRange(range).run()
      editor
        .chain()
        .focus()
        .setImage({ src: imageUrl, alt: '', title: '' })
        .insertContent('')
        .run()
      editor.chain().blur().run()
    }
    setShowLink(false)
  }

  useEffect(() => {
    const navigationKeys = ['ArrowUp', 'ArrowDown', 'Enter', 'Escape']
    const onKeyDown = (e: KeyboardEvent) => {
      if (navigationKeys.includes(e.key)) {
        e.preventDefault()
        if (e.key === 'ArrowUp') {
          setSelectedIndex((selectedIndex + items.length - 1) % items.length)
          return true
        }
        if (e.key === 'ArrowDown') {
          setSelectedIndex((selectedIndex + 1) % items.length)
          return true
        }
        if (e.key === 'Enter') {
          const selectedItem = items[selectedIndex]
          showLink
            ? addImageUrl(imageUrl)
            : handleItemAction(selectedItem.title)
          return true
        }
        if (e.key === 'Escape') {
          if (showLink) {
            setShowLink(false)
          } else {
            setImageMenu(false)
            editor.chain().focus().run()
          }
          return true
        }
        return false
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [selectedIndex, showLink, items])

  useEffect(() => {
    editor.chain().blur().run()
  }, [])

  useEffect(() => {
    setSelectedIndex(0)
  }, [items])

  const commandListContainer = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const container = commandListContainer?.current

    const item = container?.children[selectedIndex] as HTMLElement

    if (item && container) updateScrollView(container, item)
  }, [selectedIndex])

  return (
    <div id="outstatic">
      {showLink ? (
        <div className="flex w-[500px] rounded-sm border border-black outline-none">
          <div
            className={`relative w-[500px] border-r outline-none border-black`}
          >
            <input
              type="text"
              className={`w-full h-full py-2 px-3 outline-none ${
                errors.imageUrl ? 'bg-red-50' : 'bg-white'
              }`}
              placeholder="Insert link here"
              onChange={(e) => setImageUrl(e.target.value)}
              value={imageUrl}
              onFocus={() => setErrors({ ...errors, imageUrl: '' })}
              autoFocus
            />
            {errors.imageUrl && (
              <span className="absolute text-red-500 top-10 left-0">
                {errors.imageUrl}
              </span>
            )}
          </div>
          <MDEMenuButton
            onClick={() => addImageUrl(imageUrl)}
            editor={editor}
            name="back"
          >
            Done
          </MDEMenuButton>
        </div>
      ) : showMediaLibrary ? (
        <MediaLibraryModal
          open={showMediaLibrary}
          onOpenChange={setShowMediaLibrary}
          onSelect={addImageUrl}
        />
      ) : (
        <div
          id="slash-command"
          ref={commandListContainer}
          className="z-50 h-auto max-h-[330px] w-72 overflow-y-auto rounded-md border border-stone-200 bg-white px-1 py-2 shadow-md transition-all"
        >
          {items.map((item: CommandItemProps, index: number) => {
            return (
              <button
                className={`flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm text-stone-900 hover:bg-stone-100 ${
                  index === selectedIndex ? 'bg-stone-100 text-stone-900' : ''
                }`}
                key={index}
                onClick={() => handleItemAction(item.title)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleItemAction(item.title)
                  }
                }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-stone-200 bg-white">
                  {item.icon}
                </div>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-stone-500">{item.description}</p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ImageCommandList
