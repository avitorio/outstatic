import { useContext } from 'react'
import { useFormContext } from 'react-hook-form'
import TextareaAutosize, {
  TextareaAutosizeProps
} from 'react-textarea-autosize'
import convert from 'url-slug'
import { PostContext } from '../../context'

export type PostTitleProps = {
  label?: string
  id: string
  placeholder?: string
  helperText?: string
  type?: string
  readOnly?: boolean
  wrapperClass?: string
  className?: string
} & TextareaAutosizeProps

export default function PostTitle({
  label,
  placeholder = '',
  helperText,
  id,
  readOnly = false,
  wrapperClass,
  ...rest
}: PostTitleProps) {
  const {
    register,
    formState: { errors },
    setValue
  } = useFormContext()
  const { editor } = useContext(PostContext)

  return (
    <div className={wrapperClass}>
      <div className="relative">
        <TextareaAutosize
          {...register(id, {
            onChange: (e) => {
              const segments = new URL(document.location.href).pathname.split(
                '/'
              )
              const last = segments.pop() || segments.pop()
              if (last === 'new') {
                setValue(
                  'slug',
                  convert(e.target.value, { dictionary: { "'": '' } })
                )
              }
            }
          })}
          {...rest}
          name={id}
          id={id}
          readOnly={readOnly}
          placeholder={placeholder}
          aria-describedby={id}
          autoFocus
          onKeyDown={(e) => {
            if (e.key.toLowerCase() === 'enter') {
              e.preventDefault()
              editor.commands.focus('start')
            }
          }}
        />
      </div>
      <div className="mt-1">
        {helperText && <p className="text-xs text-gray-500">{helperText}</p>}
        {errors[id]?.message && (
          <span className="text-sm text-red-500">
            {errors[id]?.message?.toString()}
          </span>
        )}
      </div>
    </div>
  )
}
