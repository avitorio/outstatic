import { getTiptapExtensions } from '@/components/editor/extensions/index'
import { TiptapEditorProps } from '@/components/editor/props'
import { getPrevText } from '@/components/editor/utils/getPrevText'
import Placeholder from '@tiptap/extension-placeholder'
import { Editor, EditorEvents, useEditor } from '@tiptap/react'
import { useCompletion } from '@ai-sdk/react'
import { useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { useDebouncedCallback } from 'use-debounce'
import { useOutstatic } from '@/utils/hooks/useOutstatic'
import { OUTSTATIC_API_PATH } from '@/utils/constants'
import { stringifyError } from '@/utils/errors/stringifyError'
import { useUpgradeDialog } from '@/components/ui/outstatic/upgrade-dialog-context'

export const useTipTap = ({ ...rhfMethods }) => {
  const { hasAIProviderKey, isPro, basePath } = useOutstatic()
  const { openUpgradeDialog } = useUpgradeDialog()
  const { setValue } = rhfMethods

  const editorRef = useRef<Editor | null>(null)
  const streamingStateRef = useRef<{
    startPos: number
    lastCompletion: string
  } | null>(null)
  const prevIsLoadingRef = useRef(false)

  const debouncedCallback = useDebouncedCallback(async ({ editor }) => {
    const val = editor.getHTML()
    setValue('content', val && !editor.isEmpty ? val : '')
  }, 500)

  const { complete, completion, isLoading, stop } = useCompletion({
    id: 'outstatic',
    api: basePath + OUTSTATIC_API_PATH + '/generate',
    onError: (err) => {
      const editor = editorRef.current
      editor?.commands.removeClass('completing')
      streamingStateRef.current = null
      console.error('AI completion error', err)
      const errorToast = toast.error(err.message, {
        action: {
          label: 'Copy Logs',
          onClick: () => {
            navigator.clipboard.writeText(`Error: ${stringifyError(err)}`)
            toast.message('Logs copied to clipboard', {
              id: errorToast
            })
          }
        }
      })
    }
  })

  // Handle loading state changes
  useEffect(() => {
    const wasLoading = prevIsLoadingRef.current
    prevIsLoadingRef.current = isLoading

    if (wasLoading && !isLoading) {
      // Loading just finished - do final render with full markdown parsing
      const editor = editorRef.current
      const state = streamingStateRef.current

      if (editor && state && completion) {
        try {
          // Calculate the end position of previously inserted content
          // We need to find and remove any raw markdown text we inserted
          const docSize = editor.state.doc.content.size
          const deleteFrom = state.startPos
          const deleteTo = Math.min(
            state.startPos + state.lastCompletion.length,
            docSize
          )

          if (deleteFrom < deleteTo && deleteFrom >= 0) {
            editor.commands.deleteRange({
              from: deleteFrom,
              to: deleteTo
            })
          }

          // Insert the final content with full markdown parsing
          editor.commands.insertContentAt(state.startPos, completion, {
            parseOptions: {
              preserveWhitespace: false
            }
          })
        } catch (error) {
          console.error('Error inserting final completion:', error)
        }
      }

      if (editor) {
        editor.commands.removeClass('completing')
        const val = editor.getHTML()
        setValue('content', val && !editor.isEmpty ? val : '')
      }
      streamingStateRef.current = null
    } else if (!wasLoading && isLoading) {
      editorRef.current?.commands.addClass('completing')
    }
  }, [isLoading, setValue, completion])

  // Stream the completion into the editor as it arrives (as plain text for speed)
  useEffect(() => {
    const editor = editorRef.current
    const state = streamingStateRef.current

    if (!editor || !state || !isLoading) return

    const newText = completion
    if (!newText || newText === state.lastCompletion) return

    try {
      const docSize = editor.state.doc.content.size
      const deleteFrom = state.startPos
      const deleteTo = Math.min(
        state.startPos + state.lastCompletion.length,
        docSize
      )

      // Delete previous plain text insertion
      if (
        state.lastCompletion.length > 0 &&
        deleteFrom < deleteTo &&
        deleteFrom >= 0
      ) {
        const { tr } = editor.state
        tr.delete(deleteFrom, deleteTo)
        editor.view.dispatch(tr)
      }

      // Insert new text as plain text (fast, no parsing)
      const insertPos = Math.min(state.startPos, editor.state.doc.content.size)
      if (insertPos >= 0) {
        const { tr } = editor.state
        tr.insertText(newText, insertPos)
        editor.view.dispatch(tr)
      }

      state.lastCompletion = newText
    } catch (error) {
      console.error('Error streaming completion:', error)
    }
  }, [completion, isLoading])

  const onUpdate = useCallback(
    ({ editor }: EditorEvents['update']) => {
      if (streamingStateRef.current !== null) {
        return
      }

      const selection = editor.state.selection
      const lastTwo = getPrevText(editor, {
        chars: 2
      })
      if (lastTwo === '++' && !isLoading) {
        editor.commands.deleteRange({
          from: selection.from - 2,
          to: selection.from
        })

        if (!(hasAIProviderKey || isPro)) {
          openUpgradeDialog()
          return
        }

        const prevText = getPrevText(editor, { chars: 5000 })

        if (prevText === '') {
          toast.error('Write some content so the AI can continue.')
        } else {
          streamingStateRef.current = {
            startPos: editor.state.selection.from,
            lastCompletion: ''
          }

          complete(prevText, {
            body: { option: 'continue', command: '' }
          })
        }
      } else {
        debouncedCallback({ editor })
      }
    },
    [hasAIProviderKey, isPro, isLoading, complete, debouncedCallback, openUpgradeDialog]
  )

  const editor = useEditor({
    extensions: [
      ...getTiptapExtensions({
        onShowUpgradeDialog: openUpgradeDialog
      }),
      Placeholder.configure({
        placeholder: ({ editor, node }) => {
          if (editor.isActive('tableCell') || editor.isActive('tableHeader')) {
            return ''
          }

          if (node.type.name === 'heading') {
            return `Heading ${node.attrs.level}`
          }

          if (
            node.type.name === 'bulletList' ||
            node.type.name === 'orderedList'
          ) {
            return ''
          }

          return "Press '/' for commands, or '++' for AI autocomplete..."
        },
        includeChildren: false
      })
    ],
    editorProps: TiptapEditorProps,
    onUpdate,
    immediatelyRender: false
  })

  useEffect(() => {
    if (!editor || editorRef.current) return
    editorRef.current = editor
  }, [editor])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || (e.metaKey && e.key === 'z')) {
        stop()
        if (e.key === 'Escape') {
          const editor = editorRef.current
          const state = streamingStateRef.current

          if (editor && state && state.lastCompletion.length > 0) {
            try {
              const docSize = editor.state.doc.content.size
              const from = state.startPos
              const to = Math.min(
                state.startPos + state.lastCompletion.length,
                docSize
              )

              if (from >= 0 && from < to) {
                const { tr } = editor.state
                tr.delete(from, to)
                editor.view.dispatch(tr)
              }
            } catch (error) {
              console.error('Error deleting completion on cancel:', error)
            }
          }
          editor?.commands.removeClass('completing')
          streamingStateRef.current = null
          toast.message('AI writing cancelled.')
        }
      }
    }
    const mousedownHandler = (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      stop()
      if (window.confirm('AI writing paused. Continue?')) {
        if (editor?.getText()) {
          streamingStateRef.current = {
            startPos: editor.state.selection.from,
            lastCompletion: ''
          }
          complete(editor.getText(), {
            body: { option: 'continue', command: '' }
          })
        }
      } else {
        editor?.commands.removeClass('completing')
        streamingStateRef.current = null
      }
    }
    if (!isLoading) return

    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('mousedown', mousedownHandler)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('mousedown', mousedownHandler)
    }
  }, [stop, isLoading, editor, complete])

  return { editor: editor as Editor }
}
