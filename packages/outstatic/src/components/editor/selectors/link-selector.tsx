import { Button } from '@outstatic/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@outstatic/ui/popover'
import { cn } from '@outstatic/ui/utils'
import { Check, Trash } from 'lucide-react'
import { useEditor } from '@/components/editor/editor-context'
import { useEffect, useRef } from 'react'
import { EditorBubbleButton } from '@/components/editor/ui/editor-bubble-button'

export function isValidUrl(url: string) {
  try {
    // Check if the URL is absolute
    new URL(url)
    return true
  } catch (_e) {
    // If not, check if it's a valid relative path
    return url.startsWith('/')
  }
}

export function getUrlFromString(str: string) {
  if (isValidUrl(str)) return str
  try {
    if (str.includes('.') && !str.includes(' ')) {
      return new URL(`https://${str}`).toString()
    }
  } catch (_e) {
    return null
  }
}

interface LinkSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const LinkSelector = ({ open, onOpenChange }: LinkSelectorProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const { editor } = useEditor()

  // Autofocus on input by default
  useEffect(() => {
    inputRef.current?.focus()
  })

  if (!editor) return null

  return (
    <Popover modal={true} open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild className="gap-2">
        <EditorBubbleButton name="link">
          <p className="text-base">↗</p>
          <p
            className={cn('underline decoration-stone-400 underline-offset-4', {
              'text-blue-500': editor.isActive('link')
            })}
          >
            Link
          </p>
        </EditorBubbleButton>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-60 p-0" sideOffset={10}>
        <form
          onSubmit={(e) => {
            const target = e.currentTarget as HTMLFormElement
            e.preventDefault()
            const input = target[0] as HTMLInputElement
            const url = getUrlFromString(input.value)
            if (url) {
              editor.chain().focus().setLink({ href: url }).run()
              onOpenChange(false)
            }
          }}
          className="flex p-1"
        >
          <input
            ref={inputRef}
            type="text"
            placeholder="Paste a link"
            className="flex-1 bg-background p-1 text-sm outline-hidden"
            defaultValue={editor.getAttributes('link').href || ''}
          />
          {editor.getAttributes('link').href ? (
            <Button
              size="icon"
              variant="outline"
              type="button"
              className="flex h-8 items-center rounded-sm p-1 text-red-600 transition-all hover:bg-red-100 dark:hover:bg-red-800"
              onClick={() => {
                editor.chain().focus().unsetLink().run()
                // @ts-ignore
                inputRef.current.value = ''
                onOpenChange(false)
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
      </PopoverContent>
    </Popover>
  )
}
