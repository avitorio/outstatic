import { Editor, EditorContent } from '@tiptap/react'
import { useCompletion } from 'ai/react'
import { useEffect, useRef } from 'react'
import { useFormContext } from 'react-hook-form'
import MDEMenu from '../MDEMenu'

interface MDEditorProps {
  editor: Editor
  id: string
}

const MDEditor = ({ id, editor }: MDEditorProps) => {
  const {
    watch,
    formState: { errors }
  } = useFormContext()
  const { completion } = useCompletion({
    api: '/api/outstatic/generate'
  })

  const watchContent = watch('content')

  const prev = useRef('')

  useEffect(() => {
    if (prev.current === '') {
      // remove the "/" command before inserting the completion
      editor
        ?.chain()
        .focus()
        .deleteRange({
          from: editor.state.selection.from - 1,
          to: editor.state.selection.to
        })
        .run()
    }
    const diff = completion.slice(prev.current.length)
    prev.current = completion
    editor?.commands.insertContent(diff)
  }, [editor, completion])

  return (
    <>
      {editor && <MDEMenu editor={editor} />}
      <EditorContent name="content" value={watchContent} editor={editor} />
      <div className="mt-1">
        {errors[id]?.message && (
          <span className="text-sm text-red-500">
            {errors[id]?.message?.toString()}
          </span>
        )}
      </div>
    </>
  )
}

export default MDEditor
