import { Editor, useEditor } from '@tiptap/react'
import { TiptapExtensions } from '../editor/extensions'
import { TiptapEditorProps } from '../editor/props'

const useTipTap = ({ ...rhfMethods }) => {
  const { setValue, trigger } = rhfMethods

  const editor = useEditor({
    extensions: TiptapExtensions,
    editorProps: TiptapEditorProps,
    autofocus: 'end',
    onUpdate({ editor }) {
      const val = editor.getHTML()
      setValue('content', val && !editor.isEmpty ? val : '')
      ;(async () => await trigger('content'))()
    }
  })

  return { editor: editor as Editor }
}

export default useTipTap
