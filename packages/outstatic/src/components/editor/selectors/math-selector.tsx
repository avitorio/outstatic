import { Button } from '@/components/ui/shadcn/button'
import { cn } from '@/utils/ui'
import { SigmaIcon } from 'lucide-react'
import { useEditor } from '@/components/editor/editor-context'
import { EditorBubbleButton } from '../ui/editor-bubble-button'

export const MathSelector = () => {
  const { editor } = useEditor()

  if (!editor) return null

  return (
    <EditorBubbleButton
      name="math"
      onSelect={() => {
        if (editor.isActive('math')) {
          editor.chain().focus().unsetLatex().run()
        } else {
          const { from, to } = editor.state.selection
          const latex = editor.state.doc.textBetween(from, to)

          if (!latex) return

          editor.chain().focus().setLatex({ latex }).run()
        }
      }}
    >
      <SigmaIcon
        className={cn('size-4', { 'text-blue-500': editor.isActive('math') })}
        strokeWidth={2.3}
      />
    </EditorBubbleButton>
  )
}
