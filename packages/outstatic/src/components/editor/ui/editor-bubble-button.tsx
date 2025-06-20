import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { useEditor } from '../editor-context'
import { Editor } from '@tiptap/react'

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onSelect'> {
  name: string
  attributes?: Record<string, string>
  asChild?: boolean
  readonly onSelect?: (editor: Editor) => void
}

const EditorBubbleButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      name,
      onSelect,
      attributes,
      children,
      asChild = false,
      onClick,
      ...props
    },
    ref
  ) => {
    const { editor } = useEditor()

    if (!editor) return null

    const Comp = asChild ? Slot : 'button'

    return (
      <Comp
        className={`inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer group border-r rounded-none border-muted py-4 px-4 last-of-type:border-r-0 last-of-type:rounded-tr-md last-of-type:rounded-br-md first-of-type:rounded-tl-md first-of-type:rounded-bl-md disabled:cursor-not-allowed disabled:hover:bg-gray-600 h-9 ${
          editor.isActive(name, attributes)
            ? 'is-active bg-muted'
            : 'bg-background text-foreground hover:bg-muted'
        } ${className}`}
        ref={ref}
        {...props}
        onClick={(e) => {
          if (onSelect) {
            e.preventDefault()
            onSelect(editor)
          } else {
            onClick?.(e)
          }
        }}
      >
        {children}
      </Comp>
    )
  }
)
EditorBubbleButton.displayName = 'EditorBubbleButton'

export { EditorBubbleButton }
