import { useOutstatic } from '@/utils/hooks/useOutstatic'
import { Editor, Range } from '@tiptap/react'
import { useCompletion } from '@ai-sdk/react'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from 'react'
import { toast } from 'sonner'
import {
  CommandItemProps,
  updateScrollView
} from '@/components/editor/extensions/slash-command'
import { getPrevText } from '@/components/editor/utils/getPrevText'
import { OUTSTATIC_API_PATH } from '@/utils/constants'
import { stringifyError } from '@/utils/errors/stringifyError'

export const BaseCommandList = ({
  items,
  command,
  setImageMenu,
  editor,
  range,
  onShowUpgradeDialog
}: {
  items: CommandItemProps[]
  setImageMenu: (value: boolean) => void
  command: any
  editor: Editor
  range: Range
  onShowUpgradeDialog: (accountSlug?: string, dashboardRoute?: string) => void
}) => {
  const [selectedIndexState, setSelectedIndex] = useState(0)
  const { hasAIProviderKey, basePath, isPro, dashboardRoute, projectInfo } =
    useOutstatic()
  const selectedIndex =
    items.length === 0
      ? 0
      : Math.min(selectedIndexState, items.length - 1)

  const completionStartPos = useRef<number | null>(null)

  const { complete, isLoading } = useCompletion({
    id: 'outstatic',
    api: basePath + OUTSTATIC_API_PATH + '/generate',
    onFinish: (_prompt, completion) => {
      // highlight the generated text
      if (editor) {
        const start = editor.state.selection.from
        editor.commands.insertContentAt(start, completion)
        editor.commands.setTextSelection({
          from: start,
          to: editor.state.selection.from
        })
        editor.commands.removeClass('completing')
      }
    },
    onError: (e) => {
      completionStartPos.current = null
      console.error('AI completion error', e)
      const errorToast = toast.error(e.message, {
        action: {
          label: 'Copy Logs',
          onClick: () => {
            navigator.clipboard.writeText(`Error: ${stringifyError(e)}`)
            toast.message('Logs copied to clipboard', {
              id: errorToast
            })
          }
        }
      })
    }
  })

  const selectItem = useCallback(
    (index: number) => {
      const item = items[index]
      if (item) {
        if (item.title === 'Continue writing') {
          if (!(hasAIProviderKey || isPro)) {
            editor.chain().focus().deleteRange(range).run()
            onShowUpgradeDialog(projectInfo?.accountSlug, dashboardRoute)
            return
          }
          if (isLoading) return

          const prevText = getPrevText(editor, { chars: 5000, offset: 1 })

          if (prevText === '') {
            toast.error('Write some content so the AI can continue.')
          } else {
            // Store the position and delete the slash command range before starting completion
            completionStartPos.current = range.from
            editor.chain().focus().deleteRange(range).run()
            complete(prevText, {
              body: { option: 'continue', command: '' }
            })
          }
        } else if (item.title === 'Image') {
          setImageMenu(true)
        } else {
          command(item)
        }
      }
    },
    [
      complete,
      isLoading,
      command,
      editor,
      items,
      range,
      hasAIProviderKey,
      isPro,
      onShowUpgradeDialog,
      dashboardRoute,
      projectInfo,
      setImageMenu
    ]
  )

  useEffect(() => {
    const navigationKeys = ['ArrowUp', 'ArrowDown', 'Enter']
    const onKeyDown = (e: KeyboardEvent) => {
      if (navigationKeys.includes(e.key)) {
        e.preventDefault()
        if (e.key === 'ArrowUp') {
          setSelectedIndex((prevIndex) => {
            if (items.length === 0) return 0
            return (prevIndex + items.length - 1) % items.length
          })
          return true
        }
        if (e.key === 'ArrowDown') {
          setSelectedIndex((prevIndex) => {
            if (items.length === 0) return 0
            return (prevIndex + 1) % items.length
          })
          return true
        }
        if (e.key === 'Enter') {
          selectItem(selectedIndex)
          return true
        }
        return false
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [items.length, selectItem, selectedIndex])

  const commandListContainer = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const container = commandListContainer?.current

    const item = container?.children[selectedIndex] as HTMLElement

    if (item && container) updateScrollView(container, item)
  }, [selectedIndex])

  return items.length > 0 ? (
    <div id="outstatic">
      <div
        id="slash-command"
        ref={commandListContainer}
        className="z-50 h-auto max-h-[330px] w-72 overflow-y-auto rounded-md border border-muted bg-background px-1 py-2 shadow-md transition-all"
      >
        {items.map((item: CommandItemProps, index: number) => {
          return (
            <button
              className={`flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm text-foreground hover:bg-muted ${
                index === selectedIndex ? 'bg-muted text-foreground' : ''
              }`}
              key={index}
              onClick={() => selectItem(index)}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-muted bg-background">
                {item.title === 'Continue writing' && isLoading ? (
                  <div>
                    <svg
                      className="h-6 animate-spin text-foreground"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      width="18"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </div>
                ) : (
                  item.icon
                )}
              </div>
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  ) : null
}
