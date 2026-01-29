import {
  CommandItemProps,
  updateScrollView
} from '@/components/editor/extensions/slash-command'
import { Editor, Range } from '@tiptap/react'
import { Check, Image, Link, Upload } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { addImage } from '@/components/editor/utils/addImage'
import MediaLibraryModal from '@/components/ui/outstatic/media-library-modal'
import { API_MEDIA_PATH } from '@/utils/constants'
import { useOutstatic } from '@/utils/hooks/useOutstatic'
import MediaSettingsDialog from '@/components/ui/outstatic/media-settings-dialog'
import { Button } from '@/components/ui/shadcn/button'

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
    title: 'Media Library',
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
  const [showMediaPathDialog, setShowMediaPathDialog] = useState(false)
  const [errors, setErrors] = useState({ imageUrl: '', uploadImage: '' })
  const [selectedIndex, setSelectedIndex] = useState(0)
  const { repoMediaPath, publicMediaPath, basePath } = useOutstatic()
  const [callbackFunction, setCallbackFunction] = useState<() => void>(() => {})

  const handleItemAction = (title: string) => {
    switch (title) {
      case 'Image Upload':
        if (!repoMediaPath && !publicMediaPath) {
          setCallbackFunction(() => addImageFile)
          setShowMediaPathDialog(true)
        } else {
          addImageFile()
        }
        break
      case 'Image from URL':
        setShowLink(true)
        break
      case 'Media Library':
        if (!repoMediaPath && !publicMediaPath) {
          setCallbackFunction(() => () => setShowMediaLibrary(true))
          setShowMediaPathDialog(true)
        } else {
          setShowMediaLibrary(true)
        }
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
    if (
      !imageUrl.startsWith(`${basePath}${API_MEDIA_PATH}`) &&
      !isValidUrl(imageUrl)
    ) {
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
          document.removeEventListener('keydown', onKeyDown)
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
        <div
          className={`flex justify-between z-50 w-96 rounded-md border bg-popover text-popover-foreground shadow-md outline-hidden p-1`}
        >
          <input
            type="text"
            className={`flex-1 bg-background p-1 text-sm outline-hidden ${
              errors.imageUrl ? 'bg-red-50' : 'bg-background'
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
          <Button
            onClick={() => addImageUrl(imageUrl)}
            size="icon"
            className="h-8"
          >
            <Check className="h-4 w-4" />
          </Button>
        </div>
      ) : showMediaLibrary ? (
        <MediaLibraryModal
          open={showMediaLibrary}
          onOpenChange={setShowMediaLibrary}
          onSelect={addImageUrl}
        />
      ) : showMediaPathDialog ? (
        <MediaSettingsDialog
          showMediaPathDialog={showMediaPathDialog}
          setShowMediaPathDialog={setShowMediaPathDialog}
          callbackFunction={callbackFunction}
        />
      ) : (
        <div
          id="slash-command"
          ref={commandListContainer}
          className="z-50 h-auto max-h-[330px] w-72 overflow-y-auto rounded-md border border-muted bg-background px-1 py-2 shadow-md transition-all"
        >
          {items.map((item: CommandItemProps, index: number) => {
            return (
              <button
                className={`flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm text-foreground hover:bg-muted ${
                  index === selectedIndex ? 'bg-muted text-foreground' : ''
                }`}
                key={index}
                onClick={() => handleItemAction(item.title)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleItemAction(item.title)
                  }
                }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-muted bg-background">
                  {item.icon}
                </div>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
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
