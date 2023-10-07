import { useContext } from 'react'
import { useFormContext } from 'react-hook-form'
import TextareaAutosize, {
  TextareaAutosizeProps
} from 'react-textarea-autosize'
import { slugify } from 'transliteration'
import { DocumentContext } from '../../context'

export type DocumentTitleProps = {
  label?: string
  id: string
  placeholder?: string
  helperText?: string
  type?: string
  readOnly?: boolean
  wrapperClass?: string
  className?: string
} & TextareaAutosizeProps

export default function DocumentTitle({
  label,
  placeholder = '',
  helperText,
  id,
  readOnly = false,
  wrapperClass,
  ...rest
}: DocumentTitleProps) {
  const {
    register,
    formState: { errors },
    setValue
  } = useFormContext()
  const { editor } = useContext(DocumentContext)

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
                setValue('slug', slugify(e.target.value))
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
