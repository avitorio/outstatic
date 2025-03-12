import { EditorBubble } from '../ui/editor-bubble'
import { removeAIHighlight } from 'novel/extensions'
import {} from 'novel/plugins'
import { Fragment, type ReactNode, useEffect } from 'react'
import Magic from '../ui/icons/magic'
import { AISelector } from './ai-selector'
import { Editor } from '@tiptap/react'
import { useOutstatic } from '@/utils/hooks/useOutstatic'
import { EditorBubbleButton } from '@/components/editor/ui/editor-bubble-button'

interface GenerativeMenuSwitchProps {
  editor: Editor
  children: ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
}
const GenerativeMenuSwitch = ({
  editor,
  children,
  open,
  onOpenChange
}: GenerativeMenuSwitchProps) => {
  const { hasOpenAIKey } = useOutstatic()

  useEffect(() => {
    if (!open) removeAIHighlight(editor)
  }, [open])

  if (!editor) return null
  return (
    <EditorBubble
      tippyOptions={{
        placement: open ? 'bottom-start' : 'top',
        onHidden: () => {
          onOpenChange(false)
          editor.chain().unsetHighlight().run()
        }
      }}
      className="flex w-fit max-w-[90vw] overflow-hidden rounded-md border border-muted bg-background shadow-xl"
    >
      {open && <AISelector open={open} onOpenChange={onOpenChange} />}
      {!open && (
        <Fragment>
          {hasOpenAIKey && (
            <EditorBubbleButton
              name="ask-ai"
              className="gap-1 rounded-none text-purple-500"
              onClick={() => onOpenChange(true)}
            >
              <Magic className="h-5 w-5" />
              Ask AI
            </EditorBubbleButton>
          )}
          {children}
        </Fragment>
      )}
    </EditorBubble>
  )
}

export default GenerativeMenuSwitch
