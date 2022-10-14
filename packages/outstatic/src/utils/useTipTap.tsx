import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { Editor, ReactNodeViewRenderer, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import lowlight from 'lowlight'
import CodeBlock from '../components/CodeBlock'

const useTipTap = ({ ...rhfMethods }) => {
  const { setValue, trigger } = rhfMethods

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false
      }),
      Image.extend({
        renderHTML({ HTMLAttributes }) {
          return [
            'img',
            {
              ...HTMLAttributes,
              onError:
                'this.classList.add("image-error");this.alt="Couldn\'t load image.";'
            }
          ]
        }
      }).configure({ inline: true }),
      Placeholder.configure({
        placeholder: "What's your story?",
        showOnlyWhenEditable: false
      }),
      Link.configure({ openOnClick: false }),
      CodeBlockLowlight.extend({
        addNodeView() {
          return ReactNodeViewRenderer(CodeBlock)
        }
      }).configure({
        lowlight
      })
    ],
    onUpdate({ editor }) {
      const val = editor.getHTML()
      setValue('content', val && !editor.isEmpty ? val : '')
      ;(async () => await trigger('content'))()
    }
  })

  return { editor: editor as Editor }
}

export default useTipTap
