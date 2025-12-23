'use client'

import { Command, CommandInput } from '@/components/ui/shadcn/command'

import { useCompletion } from '@ai-sdk/react'
import { ArrowUp } from 'lucide-react'
import { addAIHighlight } from '@/components/editor/extensions/ai-higlight'
import { useState } from 'react'
import Markdown from 'react-markdown'
import { toast } from 'sonner'
import { Button } from '@/components/ui/shadcn/button'
import CrazySpinner from '@/components/editor/ui/icons/crazy-spinner'
import Magic from '@/components/editor/ui/icons/magic'
import { ScrollArea } from '@/components/ui/shadcn/scroll-area'
import AICompletionCommands from './ai-completion-command'
import AISelectorCommands from './ai-selector-commands'
import { useEditor } from '@/components/editor/editor-context'
import { useOutstatic } from '@/utils/hooks/useOutstatic'
import { OUTSTATIC_API_PATH } from '@/utils/constants'
//TODO: I think it makes more sense to create a custom Tiptap extension for this functionality https://tiptap.dev/docs/editor/ai/introduction

interface AISelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AISelector({ onOpenChange }: AISelectorProps) {
  const { basePath } = useOutstatic()
  const { editor } = useEditor()
  const [inputValue, setInputValue] = useState('')

  const { completion, complete, isLoading } = useCompletion({
    api: basePath + OUTSTATIC_API_PATH + '/generate',
    onError: (e) => {
      toast.error(e.message)
    }
  })

  const hasCompletion = completion.length > 0

  if (!editor) return null

  return (
    <Command className="w-[350px]">
      {hasCompletion && (
        <div className="flex max-h-[400px]">
          <ScrollArea>
            <div className="prose p-2 px-4 prose-sm dark:prose-invert">
              <Markdown>{completion}</Markdown>
            </div>
          </ScrollArea>
        </div>
      )}

      {isLoading && (
        <div className="flex h-12 w-full items-center px-4 text-sm font-medium text-muted-foreground text-purple-500">
          <Magic className="mr-2 h-4 w-4 shrink-0  " />
          AI is thinking
          <div className="ml-2 mt-1">
            <CrazySpinner />
          </div>
        </div>
      )}
      {!isLoading && (
        <>
          <div className="relative">
            <CommandInput
              value={inputValue}
              onValueChange={setInputValue}
              autoFocus
              placeholder={
                hasCompletion
                  ? 'Tell AI what to do next'
                  : 'Ask AI to edit or generate...'
              }
              onFocus={() => addAIHighlight(editor)}
            />
            <Button
              size="icon"
              className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-purple-500 hover:bg-purple-900"
              onClick={() => {
                if (completion)
                  return complete(completion, {
                    body: { option: 'zap', command: inputValue }
                  }).then(() => setInputValue(''))

                const slice = editor.state.selection.content()
                const text = editor.storage.markdown.serializer.serialize(
                  slice.content
                )

                complete(text, {
                  body: { option: 'zap', command: inputValue }
                }).then(() => setInputValue(''))
              }}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
          {hasCompletion ? (
            <AICompletionCommands
              onDiscard={() => {
                editor.chain().unsetHighlight().focus().run()
                onOpenChange(false)
              }}
              completion={completion}
            />
          ) : (
            <AISelectorCommands
              onSelect={(value, option) =>
                complete(value, { body: { option } })
              }
            />
          )}
        </>
      )}
    </Command>
  )
}
