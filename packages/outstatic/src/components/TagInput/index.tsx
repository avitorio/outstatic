import { CustomFieldArrayValue } from '@/types'
import { camelCase } from 'change-case'
import { useState } from 'react'
import { Controller, RegisterOptions, useFormContext } from 'react-hook-form'
import { CSSObjectWithLabel, ControlProps } from 'react-select'
import Creatable from 'react-select/creatable'
import CreatableSelect from 'react-select/dist/declarations/src/Creatable'
import { cva } from 'class-variance-authority'

export type TagProps = {
  label?: string
  id: string
  placeholder?: string
  helperText?: string
  type?: string
  readOnly?: boolean
  registerOptions?: RegisterOptions
  wrapperClass?: string
  className?: string
  suggestions?: CustomFieldArrayValue[]
  inputSize: 'small' | 'medium'
} & React.ComponentPropsWithoutRef<CreatableSelect>

const tagInputVariants = cva('', {
  variants: {
    size: {
      small: '',
      medium: ''
    }
  },
  compoundVariants: [
    {
      size: 'small',
      className: 'text-sm'
    }
  ],
  defaultVariants: {
    size: 'medium'
  }
})

const labelVariants = cva('block font-medium text-gray-900', {
  variants: {
    size: {
      small: 'mb-1 text-sm',
      medium: 'mb-2 text-sm'
    }
  }
})

const inputVariants = cva(
  'w-full rounded-lg border border-gray-300 bg-gray-50 text-gray-900 outline-none focus:border-blue-500 focus:ring-blue-500',
  {
    variants: {
      size: {
        small: 'p-2 text-sm',
        medium: 'sm:text-sm'
      }
    }
  }
)

const TagInput = ({
  label,
  helperText,
  id,
  wrapperClass,
  inputSize = 'medium',
  suggestions = [],
  ...rest
}: TagProps) => {
  const {
    control,
    getValues,
    setValue,
    formState: { errors }
  } = useFormContext()

  const [options, setOptions] = useState(suggestions)

  const createOption = (label: string) => ({
    label,
    value: camelCase(label)
  })

  const handleCreate = (inputValue: string) => {
    const newOption = createOption(inputValue)
    setOptions((prev: any) => [...prev, newOption])
    const values = getValues(id) || []
    setValue(id, [...values, newOption])
  }

  return (
    <div className={wrapperClass}>
      {label && (
        <label
          htmlFor={id}
          className={
            labelVariants({ size: inputSize }) + ' first-letter:capitalize'
          }
        >
          {label}
        </label>
      )}
      <div className="relative">
        <Controller
          name={id}
          control={control}
          render={({ field }) => (
            <Creatable
              {...field}
              options={options}
              isMulti
              className={errors.multiSelect ? 'is-invalid' : ''}
              styles={{
                control: (
                  baseStyles: CSSObjectWithLabel,
                  state: ControlProps
                ) =>
                  ({
                    ...baseStyles,
                    borderColor: state.isFocused
                      ? 'focus:ring-blue-500'
                      : 'border-gray-300 bg-gray-50',
                    borderRadius: '0.375rem',
                    backgroundColor: '#f9fafb',
                    fontSize: '0.875rem'
                  }) as CSSObjectWithLabel
              }}
              classNames={{
                menu: () => tagInputVariants({ size: inputSize }),
                control: () => inputVariants({ size: inputSize }),
                valueContainer: () => 'p-2'
              }}
              onCreateOption={handleCreate}
              isClearable={false}
              {...rest}
            />
          )}
        />
      </div>
      <div className="flex flex-wrap"></div>
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

export default TagInput
