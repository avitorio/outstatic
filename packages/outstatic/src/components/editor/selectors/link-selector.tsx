import { Button } from '@/components/ui/shadcn/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/shadcn/popover'
import { cn } from '@/utils/ui'
import { Check, Trash } from 'lucide-react'
import { useEditor } from '@/components/editor/editor-context'
import { type RefObject, useRef, useState } from 'react'
import { EditorBubbleButton } from '@/components/editor/ui/editor-bubble-button'
import { getUrlFromString } from '@/components/editor/utils/urls'

export { getUrlFromString, isValidUrl } from '@/components/editor/utils/urls'

interface LinkSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface LinkFormProps {
  inputRef: RefObject<HTMLInputElement | null>
  onClose: () => void
}

const LinkForm = ({ inputRef, onClose }: LinkFormProps) => {
  const { editor } = useEditor()
  const [value, setValue] = useState(
    () => editor?.getAttributes('link').href || ''
  )

  if (!editor) return null

  const href = editor.getAttributes('link').href || ''
  const isChanged = value !== href

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const url = getUrlFromString(value)
        if (url) {
          editor.chain().focus().setLink({ href: url }).run()
          onClose()
        }
      }}
      className="flex p-1"
    >
      <input
        ref={inputRef}
        type="text"
        placeholder="Paste a link"
        className="flex-1 bg-background p-1 text-sm outline-hidden"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      {href && !isChanged ? (
        <Button
          size="icon"
          variant="outline"
          type="button"
          className="flex h-8 items-center rounded-sm p-1 text-red-600 transition-all hover:bg-red-100 dark:hover:bg-red-800"
          onClick={() => {
            editor.chain().focus().unsetLink().run()
            setValue('')
            onClose()
          }}
        >
          <Trash className="h-4 w-4" />
        </Button>
      ) : (
        <Button size="icon" className="h-8">
          <Check className="h-4 w-4" />
        </Button>
      )}
    </form>
  )
}

export const LinkSelector = ({ open, onOpenChange }: LinkSelectorProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const { editor } = useEditor()

  if (!editor) return null

  return (
    <Popover modal={true} open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild className="gap-2">
        <EditorBubbleButton name="link">
          <p className="text-base">↗</p>
          <p
            className={cn('underline decoration-muted underline-offset-4', {
              'text-blue-500': editor.isActive('link')
            })}
          >
            Link
          </p>
        </EditorBubbleButton>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-60 p-0"
        sideOffset={10}
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          inputRef.current?.focus()
        }}
      >
        <LinkForm inputRef={inputRef} onClose={() => onOpenChange(false)} />
      </PopoverContent>
    </Popover>
  )
}
