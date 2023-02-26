import { useFormContext, RegisterOptions } from 'react-hook-form'

export type TextAreaProps = {
  label?: string
  id: string
  placeholder?: string
  helperText?: string
  type?: string
  readOnly?: boolean
  validation?: RegisterOptions
  wrapperClass?: string
} & React.ComponentPropsWithoutRef<'textarea'>

export default function TextArea({
  label,
  placeholder = '',
  helperText,
  id,
  type = 'text',
  readOnly = false,
  validation,
  wrapperClass,
  ...rest
}: TextAreaProps) {
  const {
    register,
    formState: { errors }
  } = useFormContext()

  return (
    <div className={wrapperClass}>
      {label && (
        <label
          htmlFor={id}
          className="mb-1 block text-sm font-medium text-gray-900"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <textarea
          {...register(id, validation)}
          {...rest}
          name={id}
          id={id}
          readOnly={readOnly}
          placeholder={placeholder}
          aria-describedby={id}
          className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-blue-500"
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
