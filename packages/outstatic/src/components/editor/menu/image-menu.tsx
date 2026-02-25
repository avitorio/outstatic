import { useCallback, useState } from 'react'
import { useFileStore } from '@/utils/hooks/use-file-store'
import { Editor } from '@tiptap/core'
import { EditorBubbleButton } from '@/components/editor/ui/editor-bubble-button'
import { LinkSelector } from '@/components/editor/selectors/link-selector'
import { BubbleMenu } from '@tiptap/react'

type ImageMenuProps = {
  editor: Editor
}

const ImageMenu = ({ editor }: ImageMenuProps) => {
  const { removeFile } = useFileStore()
  const [showLink, setShowLink] = useState(false)
  const [showAltText, setShowAltText] = useState(false)
  const [altText, setAltText] = useState('')
  const shouldShow = useCallback(() => {
    return editor.isActive('image')
  }, [editor])

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
      <div className="flex rounded-md border border-muted bg-background shadow-md transition-all">
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
              className="w-[500px] border-r border-muted px-3 outline-hidden"
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
