import { useCallback, useState } from 'react'
import { useFileStore } from '@/utils/hooks/useFileStore'
import { Editor } from '@tiptap/core'
import { EditorBubbleButton } from '@/components/editor/ui/editor-bubble-button'
import { LinkSelector } from '@/components/editor/selectors/link-selector'
import { BubbleMenu } from '@tiptap/react'
import { ChevronLeft } from 'lucide-react'

type ImageMenuProps = {
  editor: Editor
}

const ImageMenu = ({ editor }: ImageMenuProps) => {
  const { removeFile } = useFileStore()
  const [showLink, setShowLink] = useState(false)
  const [url, setUrl] = useState('')
  const [showAltText, setShowAltText] = useState(false)
  const [altText, setAltText] = useState('')
  const shouldShow = useCallback(() => {
    return editor.isActive('image')
  }, [editor])

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
    editor.chain().blur().run()
    setUrl('')
    setAltText('')
  }, [editor, altText])

  const removeImage = () => {
    const blob = editor.getAttributes('image').src
    removeFile(blob)
    editor.chain().focus().deleteSelection().run()
  }

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
        {showAltText && (
          <>
            <EditorBubbleButton
              onClick={() => {
                setShowAltText(false)
              }}
              name="back"
            >
              <p className="text-base">←</p>
            </EditorBubbleButton>
            <input
              id="alt-text"
              name="alt-text"
              required
              className="w-[500px] border-r border-stone-200 px-3 outline-none"
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
                }
              }}
              defaultValue={altText}
              autoFocus
            />
            <EditorBubbleButton onClick={addAltText} name="addAltText">
              Done
            </EditorBubbleButton>
          </>
        )}
        {!showAltText && (
          <>
            <LinkSelector open={showLink} onOpenChange={setShowLink} />
            <EditorBubbleButton
              onClick={() => {
                setAltText(editor.getAttributes('image').alt)
                setShowAltText(true)
              }}
              name="image"
              attributes={
                editor.getAttributes('image').alt
                  ? { alt: editor.getAttributes('image').alt }
                  : { alt: false }
              }
            >
              Alt Text
            </EditorBubbleButton>
            <EditorBubbleButton onClick={removeImage} name="remove-image">
              Remove Image
            </EditorBubbleButton>
          </>
        )}
      </div>
    </BubbleMenu>
  )
}

export default ImageMenu
