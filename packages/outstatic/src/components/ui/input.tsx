import { RegisterOptions, useFormContext } from 'react-hook-form'

export type InputProps = {
  label?: string
  id: string
  placeholder?: string
  helperText?: string
  type?: string
  readOnly?: boolean
  registerOptions?: RegisterOptions
  wrapperClass?: string
  className?: string
  inputSize?: 'small' | 'medium'
} & React.ComponentPropsWithoutRef<'input'>

const sizes = {
  small: {
    label: 'mb-1 block text-sm font-medium text-gray-900',
    input:
      '"flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
  },
  medium: {
    label: 'block mb-2 text-sm font-medium text-gray-900',
    input:
      '"flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
  }
}

const Input = ({
  label,
  placeholder = '',
  helperText,
  id,
  type = 'text',
  readOnly = false,
  registerOptions,
  wrapperClass,
  className,
  inputSize = 'medium',
  ...rest
}: InputProps) => {
  const {
    register,
    formState: { errors }
  } = useFormContext()

  return (
    <div className={wrapperClass}>
      {label && (
        <label
          htmlFor={id}
          className={`${sizes[inputSize].label} first-letter:capitalize`}
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          {...register(id, registerOptions)}
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
          <div className="mt-1 first-letter:capitalize">
            {helperText && (
              <p className="text-xs text-gray-500">{helperText}</p>
            )}
            {errors[id]?.message && (
              <span className="text-sm text-red-500">
                {errors[id]?.message?.toString()}
              </span>
            )}
          </div>
        )}
      </>
    </div>
  )
}

export default Input
