import { Editor } from '@tiptap/react'

type MDEMenuButtonProps = {
  editor: Editor
  onClick: () => void
  children: React.ReactNode
  name: string
  disabled?: boolean
  attributes?: {} | undefined
}

const MDEMenuButton = ({
  onClick,
  editor,
  children,
  name,
  disabled = false,
  attributes = {}
}: MDEMenuButtonProps) => (
  <button
    onClick={(e) => {
      e.preventDefault()
      onClick()
    }}
    title={name}
    className={`group border-r border-black py-2 px-3 last-of-type:border-r-0 hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:hover:bg-gray-600 ${
      editor.isActive(name, attributes)
        ? 'is-active bg-black text-white [&>svg]:fill-white'
        : 'bg-white text-black'
    }`}
    disabled={disabled}
  >
    {children}
  </button>
)

export default MDEMenuButton
