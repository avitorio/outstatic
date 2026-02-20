import {
  ArrowDownWideNarrow,
  CheckCheck,
  RefreshCcwDot,
  StepForward,
  WrapText
} from 'lucide-react'
import { useEffect } from 'react'
import { useEditor } from '@/components/editor/editor-context'
import { getPrevText } from '@/components/editor/utils/getPrevText'
import {
  CommandList,
  CommandGroup,
  CommandItem,
  CommandSeparator
} from '@/components/ui/shadcn/command'

const options = [
  {
    value: 'improve',
    label: 'Improve writing',
    icon: RefreshCcwDot
  },

  {
    value: 'fix',
    label: 'Fix grammar',
    icon: CheckCheck
  },
  {
    value: 'shorter',
    label: 'Make shorter',
    icon: ArrowDownWideNarrow
  },
  {
    value: 'longer',
    label: 'Make longer',
    icon: WrapText
  }
]

interface AISelectorCommandsProps {
  onSelect: (value: string, option: string) => void
  onClose: () => void
}

const AISelectorCommands = ({ onSelect, onClose }: AISelectorCommandsProps) => {
  const { editor } = useEditor()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      onClose()
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  if (!editor) return null

  return (
    <CommandList>
      <CommandGroup heading="Edit or review selection">
        {options.map((option) => (
          <CommandItem
            onSelect={(value) => {
              const slice = editor.state.selection.content()
              const text = editor.storage.markdown.serializer.serialize(
                slice.content
              )
              onSelect(text, value)
            }}
            className="flex gap-2 px-4"
            key={option.value}
            value={option.value}
          >
            <option.icon className="h-4 w-4 text-black" />
            {option.label}
          </CommandItem>
        ))}
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup heading="Use AI to do more">
        <CommandItem
          onSelect={() => {
            const pos = editor.state.selection.from
            const text = getPrevText(editor, { chars: pos })
            onSelect(text, 'continue')
          }}
          value="continue"
          className="gap-2 px-4"
        >
          <StepForward className="h-4 w-4 text-black" />
          Continue writing
        </CommandItem>
      </CommandGroup>
    </CommandList>
  )
}

export default AISelectorCommands
