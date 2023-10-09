import {
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useRef,
  useLayoutEffect,
  useContext
} from 'react'
import { Editor, Range, Extension } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'
import { ReactRenderer } from '@tiptap/react'
import tippy from 'tippy.js'
import { startImageUpload } from '../plugins/upload-images'
import { DocumentContext } from '../../../context'
import { FileType } from '../../../types'
import { getSuggestionItems } from '../utils/slash-command/getSuggestionItems'

export type CommandItemProps = {
  title: string
  description: string
  icon: ReactNode
  command?: ({ editor, range }: CommandProps) => void
  searchTerms: string[]
  subItems?: CommandItemProps[]
}

export type CommandProps = {
  editor: Editor
  range: Range
}

const Command = Extension.create({
  name: 'slash-command',
  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({
          editor,
          range,
          props
        }: {
          editor: Editor
          range: Range
          props: any
        }) => {
          props.command({ editor, range })
        }
      }
    }
  },
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion
      })
    ]
  }
})

export const updateScrollView = (container: HTMLElement, item: HTMLElement) => {
  const containerHeight = container.offsetHeight
  const itemHeight = item ? item.offsetHeight : 0

  const top = item.offsetTop
  const bottom = top + itemHeight

  if (top < container.scrollTop) {
    container.scrollTop -= container.scrollTop - top + 5
  } else if (bottom > containerHeight + container.scrollTop) {
    container.scrollTop += bottom - containerHeight - container.scrollTop + 5
  }
}

const CommandList = ({
  items,
  command,
  editor,
  range
}: {
  items: CommandItemProps[]
  command: any
  editor: Editor
  range: Range
}) => {
  const { setFiles } = useContext(DocumentContext)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [parentIndex, setParentIndex] = useState(0)
  const [selectedSubItems, setSelectedSubItems] = useState(false)

  const selectItem = (index: number) => {
    const item = selectedSubItems
      ? // @ts-ignore
        items[parentIndex].subItems[index]
      : items[index]

    if (item.title === 'Image Upload') {
      editor.chain().focus().deleteRange(range).run()
      // upload image
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.onchange = async () => {
        if (input.files?.length) {
          const file = input.files[0]
          const blob = URL.createObjectURL(file)
          editor.chain().focus().setImage({ src: blob, alt: '' }).run()
          const reader = new FileReader()
          reader.readAsArrayBuffer(file)
          reader.onloadend = () => {
            const bytes = reader.result as string
            const buffer = Buffer.from(bytes, 'binary')
            setFiles((files: FileType[]) => [
              ...files,
              {
                type: 'images',
                blob,
                filename: file.name,
                content: buffer.toString('base64')
              }
            ])
          }
          editor.chain().blur().run()
        }
      }
      input.click()
    } else if (item) {
      command(item)
    }
  }

  useEffect(() => {
    const navigationKeys = ['ArrowUp', 'ArrowDown', 'Enter']
    const onKeyDown = (e: KeyboardEvent) => {
      if (navigationKeys.includes(e.key)) {
        e.preventDefault()
        const navItems = selectedSubItems
          ? (items[parentIndex].subItems as CommandItemProps[])
          : items
        if (e.key === 'ArrowUp') {
          setSelectedIndex(
            (selectedIndex + navItems.length - 1) % navItems.length
          )
          return true
        }
        if (e.key === 'ArrowDown') {
          setSelectedIndex((selectedIndex + 1) % navItems.length)
          return true
        }
        if (e.key === 'Enter') {
          if (navItems[selectedIndex].subItems) {
            setParentIndex(selectedIndex)
            setSelectedSubItems(true)
            setSelectedIndex(0)
            return true
          } else {
            selectItem(selectedIndex)
            return true
          }
        }
        return false
      } else {
        setSelectedSubItems(false)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [items, selectedIndex, setSelectedIndex, selectItem, parentIndex])

  useEffect(() => {
    setSelectedIndex(0)
  }, [items])

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
        className="z-50 h-auto max-h-[330px] w-72 overflow-y-auto rounded-md border border-stone-200 bg-white px-1 py-2 shadow-md transition-all"
      >
        {
          //@ts-ignore}
          (selectedSubItems ? items[parentIndex].subItems : items).map(
            (item: CommandItemProps, index: number) => {
              return (
                <button
                  className={`flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm text-stone-900 hover:bg-stone-100 ${
                    index === selectedIndex ? 'bg-stone-100 text-stone-900' : ''
                  }`}
                  key={index}
                  onClick={() => selectItem(index)}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-md border border-stone-200 bg-white">
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-stone-500">{item.description}</p>
                  </div>
                </button>
              )
            }
          )
        }
      </div>
    </div>
  ) : null
}

const renderItems = () => {
  let component: ReactRenderer | null = null
  let popup: any | null = null

  return {
    onStart: (props: { editor: Editor; clientRect: DOMRect }) => {
      component = new ReactRenderer(CommandList, {
        props,
        editor: props.editor
      })

      // @ts-ignore
      popup = tippy('body', {
        getReferenceClientRect: props.clientRect,
        appendTo: () => document.body,
        content: component.element,
        showOnCreate: true,
        interactive: true,
        trigger: 'manual',
        placement: 'bottom-start'
      })
    },
    onUpdate: (props: { editor: Editor; clientRect: DOMRect }) => {
      component?.updateProps(props)

      popup &&
        popup[0].setProps({
          getReferenceClientRect: props.clientRect
        })
    },
    onKeyDown: (props: { event: KeyboardEvent }) => {
      if (props.event.key === 'Escape') {
        popup?.[0].hide()

        return true
      }

      // @ts-ignore
      return component?.ref?.onKeyDown(props)
    },
    onExit: () => {
      popup?.[0].destroy()
      component?.destroy()
    }
  }
}

const SlashCommand = Command.configure({
  suggestion: {
    items: getSuggestionItems,
    render: renderItems
  }
})

export default SlashCommand
