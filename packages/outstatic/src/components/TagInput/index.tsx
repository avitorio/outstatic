import { CustomFieldArrayValue } from '@/types'
import camelcase from 'camelcase'
import { useState } from 'react'
import { Controller, RegisterOptions, useFormContext } from 'react-hook-form'
import Creatable from 'react-select/creatable'
import CreatableSelect from 'react-select/dist/declarations/src/Creatable'

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
  inputSize?: 'small' | 'medium'
} & React.ComponentPropsWithoutRef<CreatableSelect>

const sizes = {
  small: {
    label: 'mb-1 block text-sm font-medium text-gray-900',
    input:
      'w-full rounded-lg border border-gray-300 bg-gray-50 p-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-blue-500'
  },
  medium: {
    label: 'block mb-2 text-sm font-medium text-gray-900',
    input:
      'w-full text-gray-900 bg-gray-50 rounded-lg border border-gray-300 sm:text-sm outline-none focus:ring-blue-500 focus:border-blue-500'
  }
}

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
    value: camelcase(label)
  })

  const handleCreate = (inputValue: string) => {
    const newOption = createOption(inputValue)
    setOptions((prev) => [...prev, newOption])
    const values = getValues(id) || []
    setValue(id, [...values, newOption])
  }

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
                control: (baseStyles, state) => ({
                  ...baseStyles,
                  borderColor: state.isFocused
                    ? 'focus:ring-blue-500'
                    : 'border-gray-300 bg-gray-50',
                  borderRadius: '0.375rem',
                  backgroundColor: '#f9fafb',
                  fontSize: '0.875rem'
                })
              }}
              classNames={{
                menu: () => (inputSize === 'small' ? 'text-sm' : 'text-base'),
                control: () => sizes[inputSize].input,
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
