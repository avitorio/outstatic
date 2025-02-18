import { Editor } from '@tiptap/react'
import { createContext, useContext, useState, ReactNode } from 'react'

interface EditorContextType {
  editor: Editor | null
  setEditor: (editor: Editor) => void
}

const EditorContext = createContext<EditorContextType | undefined>(undefined)

export function useEditor() {
  const context = useContext(EditorContext)
  if (context === undefined) {
    throw new Error('useEditor must be used within an EditorProvider')
  }
  return context
}

interface EditorProviderProps {
  children: ReactNode
}

export function EditorProvider({ children }: EditorProviderProps) {
  const [editor, setEditor] = useState<Editor | null>(null)

  return (
    <EditorContext.Provider value={{ editor, setEditor }}>
      {children}
    </EditorContext.Provider>
  )
}
