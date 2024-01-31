import MDEMenu from '@/components/MDEMenu'
import { Editor, EditorContent } from '@tiptap/react'
import { useFormContext } from 'react-hook-form'

interface MDEditorProps {
  editor: Editor
  id: string
}

const MDEditor = ({ id, editor }: MDEditorProps) => {
  const {
    watch,
    formState: { errors }
  } = useFormContext()

  const watchContent = watch('content')

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
