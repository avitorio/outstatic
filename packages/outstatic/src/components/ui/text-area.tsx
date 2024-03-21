import { RegisterOptions, useFormContext } from 'react-hook-form'

export type TextAreaProps = {
  label?: string
  id: string
  placeholder?: string
  helperText?: string
  type?: string
  readOnly?: boolean
  registerOptions?: RegisterOptions
  wrapperClass?: string
} & React.ComponentPropsWithoutRef<'textarea'>

export default function TextArea({
  label,
  placeholder = '',
  helperText,
  id,
  type = 'text',
  readOnly = false,
  registerOptions,
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
          {...register(id, registerOptions)}
          {...rest}
          name={id}
          id={id}
          readOnly={readOnly}
          placeholder={placeholder}
          aria-describedby={id}
          className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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
