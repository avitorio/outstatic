import EditorMenu from '@/components/editor/menu/editor-menu'
import { Editor, EditorContent } from '@tiptap/react'
import { useFormContext } from 'react-hook-form'
import { TableMenu } from './menu/table-menu'
import ImageMenu from './menu/image-menu'

interface MDEditorProps {
  editor: Editor
  id: string
}

export const MDEditor = ({ id, editor }: MDEditorProps) => {
  const {
    watch,
    formState: { errors }
  } = useFormContext()

  const watchContent = watch('content')

  return (
    <>
      {editor && <EditorMenu editor={editor} />}
      {editor && <TableMenu editor={editor} />}
      {editor && <ImageMenu editor={editor} />}
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
