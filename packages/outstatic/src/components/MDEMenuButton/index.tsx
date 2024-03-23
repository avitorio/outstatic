import { Editor } from '@tiptap/react'

type MDEMenuButtonProps = {
  editor: Editor
  onClick: () => void
  children: React.ReactNode
  name: string
  disabled?: boolean
  attributes?: {} | undefined
  tag?: keyof JSX.IntrinsicElements
  htmlFor?: string
}

const MDEMenuButton = ({
  onClick,
  editor,
  children,
  name,
  disabled = false,
  attributes = {},
  tag = 'button',
  htmlFor
}: MDEMenuButtonProps) => {
  const Tag = tag
  const inputProps = {} as any
  if (htmlFor) {
    inputProps.htmlFor = htmlFor
  }
  return (
    <Tag
      onClick={(e) => {
        e.preventDefault()
        onClick()
      }}
      title={name}
      className={`group border-r border-slate-300 py-4 px-4 last-of-type:border-r-0 last-of-type:rounded-tr-md last-of-type:rounded-br-md first-of-type:rounded-tl-md first-of-type:rounded-bl-md disabled:cursor-not-allowed disabled:hover:bg-gray-600 ${
        editor.isActive(name, attributes)
          ? 'is-active bg-slate-200'
          : 'bg-white text-black hover:bg-slate-100'
      }`}
      disabled={disabled}
      {...inputProps}
    >
      {children}
    </Tag>
  )
}

export default MDEMenuButton
