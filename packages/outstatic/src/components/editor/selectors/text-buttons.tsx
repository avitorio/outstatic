import { cn } from '@outstatic/ui/utils'
import {
  BoldIcon,
  CodeIcon,
  ItalicIcon,
  StrikethroughIcon,
  TextQuote
} from 'lucide-react'
import type { SelectorItem } from './node-selector'
import { useEditor } from '@/components/editor/editor-context'
import { EditorBubbleButton } from '@/components/editor/ui/editor-bubble-button'
import { Button } from '@outstatic/ui/button'

export const TextButtons = () => {
  const { editor } = useEditor()
  if (!editor) return null

  const items: SelectorItem[] = [
    {
      name: 'bold',
      isActive: (editor) => editor.isActive('bold'),
      command: (editor) => editor.chain().focus().toggleBold().run(),
      icon: BoldIcon
    },
    {
      name: 'italic',
      isActive: (editor) => editor.isActive('italic'),
      command: (editor) => editor.chain().focus().toggleItalic().run(),
      icon: ItalicIcon
    },
    {
      name: 'strike',
      isActive: (editor) => editor.isActive('strike'),
      command: (editor) => editor.chain().focus().toggleStrike().run(),
      icon: StrikethroughIcon
    },
    {
      name: 'code',
      isActive: (editor) => editor.isActive('code'),
      command: (editor) => editor.chain().focus().toggleCode().run(),
      icon: CodeIcon
    },
    {
      name: 'blockquote',
      isActive: (editor) => editor.isActive('blockquote'),
      command: (editor) => editor.chain().focus().toggleBlockquote().run(),
      icon: TextQuote
    }
  ]
  return (
    <>
      {items.map((item) => (
        <EditorBubbleButton
          key={item.name}
          name={item.name}
          onSelect={() => {
            item.command(editor)
          }}
        >
          <item.icon
            className={cn('h-4 w-4', {
              'text-blue-500': item.isActive(editor)
            })}
          />
        </EditorBubbleButton>
      ))}
    </>
  )
}
