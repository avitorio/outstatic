import { BubbleMenu, isNodeSelection } from '@tiptap/react'
import { useMemo, useRef, useEffect, forwardRef } from 'react'
import type { BubbleMenuProps } from '@tiptap/react'
import type { ReactNode } from 'react'
import type { Instance, Props } from 'tippy.js'
import { useEditor } from '../editor-context'

export interface EditorBubbleProps extends Omit<BubbleMenuProps, 'editor'> {
  readonly children: ReactNode
}

type EditorBubbleVisibilityArgs = Pick<
  Parameters<NonNullable<BubbleMenuProps['shouldShow']>>[0],
  'editor' | 'state'
>

export const shouldShowEditorBubble = ({
  editor,
  state
}: EditorBubbleVisibilityArgs) => {
  const { selection } = state
  const { empty } = selection

  // don't show bubble menu if:
  // - the editor is not editable
  // - the selection is inside an image, code block, or MDX block
  // - the selection is empty
  // - the selection is a node selection (for drag handles)
  if (
    !editor.isEditable ||
    editor.isActive('image') ||
    editor.isActive('codeBlock') ||
    editor.isActive('mdxBlock') ||
    empty ||
    isNodeSelection(selection)
  ) {
    return false
  }

  return true
}

export const EditorBubble = forwardRef<HTMLDivElement, EditorBubbleProps>(
  ({ children, tippyOptions, ...rest }, ref) => {
    const { editor: currentEditor } = useEditor()
    const instanceRef = useRef<Instance<Props> | null>(null)

    useEffect(() => {
      if (!instanceRef.current || !tippyOptions?.placement) return

      instanceRef.current.setProps({ placement: tippyOptions.placement })
      instanceRef.current.popperInstance?.update()
    }, [tippyOptions?.placement])

    const bubbleMenuProps: Omit<EditorBubbleProps, 'children'> = useMemo(() => {
      return {
        shouldShow: shouldShowEditorBubble,
        tippyOptions: {
          onCreate: (val) => {
            instanceRef.current = val
          },
          moveTransition: 'transform 0.15s ease-out',
          ...tippyOptions
        },
        ...rest
      }
    }, [rest, tippyOptions])

    if (!currentEditor) return null

    return (
      // We need to add this because of https://github.com/ueberdosis/tiptap/issues/2658
      <div ref={ref}>
        <BubbleMenu {...bubbleMenuProps} editor={currentEditor}>
          {children}
        </BubbleMenu>
      </div>
    )
  }
)

EditorBubble.displayName = 'EditorBubble'

export default EditorBubble
