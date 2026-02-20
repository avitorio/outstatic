import { EditorBubble } from '../ui/editor-bubble'
import { removeAIHighlight } from '@/components/editor/extensions/ai-higlight'
import { Fragment, type ReactNode, useEffect } from 'react'
import Magic from '../ui/icons/magic'
import { AISelector } from './ai-selector'
import { Editor } from '@tiptap/react'
import { useOutstatic } from '@/utils/hooks/useOutstatic'
import { EditorBubbleButton } from '@/components/editor/ui/editor-bubble-button'
import { useUpgradeDialog } from '@/components/ui/outstatic/upgrade-dialog-context'

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
  const { hasAIProviderKey, isPro } = useOutstatic()
  const { openUpgradeDialog } = useUpgradeDialog()

  useEffect(() => {
    if (!open && editor) removeAIHighlight(editor)
  }, [open, editor])

  if (!editor) return null
  return (
    <>
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
            <EditorBubbleButton
              name="ask-ai"
              className="gap-1 rounded-none text-slate-900"
              onClick={() => {
                if (hasAIProviderKey || isPro) {
                  onOpenChange(true)
                } else {
                  // Collapse selection to hide bubble menu
                  const { from } = editor.state.selection
                  editor.chain().setTextSelection(from).run()
                  openUpgradeDialog()
                }
              }}
            >
              <Magic className="h-5 w-5" />
              Ask AI
            </EditorBubbleButton>
            {children}
          </Fragment>
        )}
      </EditorBubble>
    </>
  )
}

export default GenerativeMenuSwitch
