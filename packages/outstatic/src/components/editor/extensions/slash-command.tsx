import { Extension, Range } from '@tiptap/core'
import { Editor, ReactRenderer } from '@tiptap/react'
import Suggestion from '@tiptap/suggestion'
import { ReactNode, useState } from 'react'
import tippy from 'tippy.js'
import { BaseCommandList } from '@/components/editor/extensions/slash-command/BaseCommandList'
import ImageCommandList from '@/components/editor/extensions/slash-command/ImageCommandList'
import { getSuggestionItems } from '@/components/editor/extensions/slash-command/getSuggestionItems'
import type { UpgradeDialogHandler } from '@/components/ui/outstatic/upgrade-dialog-context'

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
  range,
  onShowUpgradeDialog
}: {
  items: CommandItemProps[]
  command: any
  editor: Editor
  range: Range
  onShowUpgradeDialog: UpgradeDialogHandler
}) => {
  const [imageMenu, setImageMenu] = useState(false)

  return items.length > 0 ? (
    imageMenu ? (
      <ImageCommandList
        editor={editor}
        setImageMenu={setImageMenu}
        range={range}
      />
    ) : (
      <BaseCommandList
        items={items}
        command={command}
        setImageMenu={setImageMenu}
        editor={editor}
        range={range}
        onShowUpgradeDialog={onShowUpgradeDialog}
      />
    )
  ) : null
}

const renderItems = (onShowUpgradeDialog: UpgradeDialogHandler) => {
  let component: ReactRenderer | null = null
  let popup: any | null = null

  return {
    onStart: (props: { editor: Editor; clientRect: DOMRect }) => {
      component = new ReactRenderer(CommandList, {
        props: {
          ...props,
          onShowUpgradeDialog: (accountSlug?: string, dashboardRoute?: string) => {
            popup?.[0]?.hide()
            onShowUpgradeDialog(accountSlug, dashboardRoute)
          }
        },
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
      component?.updateProps({
        ...props,
        onShowUpgradeDialog: (accountSlug?: string, dashboardRoute?: string) => {
          popup?.[0]?.hide()
          onShowUpgradeDialog(accountSlug, dashboardRoute)
        }
      })

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
      popup?.[0]?.destroy()
      component?.destroy()
    }
  }
}

export const createSlashCommand = ({
  onShowUpgradeDialog
}: {
  onShowUpgradeDialog: UpgradeDialogHandler
}) =>
  Command.configure({
    suggestion: {
      items: getSuggestionItems,
      render: () => renderItems(onShowUpgradeDialog)
    }
  })
