import { useFormContext, RegisterOptions } from 'react-hook-form'

export type InputProps = {
  label?: string
  id: string
  placeholder?: string
  helperText?: string
  type?: string
  readOnly?: boolean
  validation?: RegisterOptions
  wrapperClass?: string
  className?: string
  inputSize?: 'small' | 'medium'
} & React.ComponentPropsWithoutRef<'input'>

const sizes = {
  small: {
    label: 'mb-1 block text-sm font-medium text-gray-900',
    input:
      'block w-full rounded-lg border border-gray-300 bg-gray-50 p-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400'
  },
  medium: {
    label: 'block mb-2 text-sm font-medium text-gray-900',
    input:
      'block p-2 w-full text-gray-900 bg-gray-50 rounded-lg border border-gray-300 sm:text-sm outline-none focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:text-gray-400'
  }
}

export default function Input({
  label,
  placeholder = '',
  helperText,
  id,
  type = 'text',
  readOnly = false,
  validation,
  wrapperClass,
  className,
  inputSize = 'medium',
  ...rest
}: InputProps) {
  const {
    register,
    formState: { errors }
  } = useFormContext()

  return (
    <div className={wrapperClass}>
      {label && (
        <label htmlFor={id} className={`${sizes[inputSize].label}`}>
          {label}
        </label>
      )}
      <div className="relative">
        <input
          {...register(id, validation)}
          {...rest}
          className={`${sizes[inputSize].input} ${className}`}
          type={type}
          name={id}
          id={id}
          readOnly={readOnly}
          placeholder={placeholder}
          aria-describedby={id}
        />
      </div>
      <>
        {(errors[id]?.message || helperText) && (
          <div className="mt-1">
            {helperText && (
              <p className="text-xs text-gray-500">{helperText}</p>
            )}
            {errors[id]?.message && (
              <span className="block text-sm text-red-500 first-letter:uppercase">
                {errors[id]?.message?.toString()}
              </span>
            )}
          </div>
        )}
      </>
    </div>
  )
}
