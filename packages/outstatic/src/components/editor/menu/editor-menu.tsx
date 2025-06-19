import { useState } from 'react'
import { NodeSelector } from '@/components/editor/selectors/node-selector'
import { LinkSelector } from '@/components/editor/selectors/link-selector'
import { TextButtons } from '@/components/editor/selectors/text-buttons'
import { MathSelector } from '@/components/editor/selectors/math-selector'
import GenerativeMenuSwitch from '../generative/generative-menu-switch'
import { Editor } from '@tiptap/react'

const EditorMenu = ({ editor }: { editor: Editor }) => {
  const [openLink, setOpenLink] = useState(false)
  const [openNode, setOpenNode] = useState(false)
  const [openAI, setOpenAI] = useState(false)

  if (!editor) return null

  return (
    <GenerativeMenuSwitch
      editor={editor}
      open={openAI}
      onOpenChange={setOpenAI}
    >
      <>
        <NodeSelector open={openNode} onOpenChange={setOpenNode} />
        <LinkSelector open={openLink} onOpenChange={setOpenLink} />
        <TextButtons />
        <MathSelector />
      </>
    </GenerativeMenuSwitch>
  )
}

export default EditorMenu
