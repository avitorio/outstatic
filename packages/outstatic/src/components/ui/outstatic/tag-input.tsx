'use client'

import { CustomFieldArrayValue } from '@/types'
import { camelCase } from 'change-case'
import { useContext, useEffect, useState } from 'react'
import { RegisterOptions, useFormContext } from 'react-hook-form'
import { DocumentContext } from '@/context'
import {
  FormMessage,
  FormDescription,
  FormItem,
  FormField
} from '../shadcn/form'
import { Label } from '../shadcn/label'
import { CreatableMultiCombobox } from './creatable-multi-combobox'

const TAG_INPUT_ROOT_SELECTOR = '[data-tag-input-root]'

export const isTagInputTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  target.closest(TAG_INPUT_ROOT_SELECTOR) !== null

export const preventTagInputEnterSubmit = (event: {
  key: string
  target: EventTarget | null
  preventDefault: () => void
}) => {
  if (event.key === 'Enter' && isTagInputTarget(event.target)) {
    event.preventDefault()
  }
}

export type TagProps = {
  label?: string
  id: string
  placeholder?: string
  description?: string
  readOnly?: boolean
  registerOptions?: RegisterOptions
  suggestions?: CustomFieldArrayValue[]
  inputSize?: 'small' | 'medium'
  isMulti?: boolean
}

export const TagInput = ({
  label,
  description,
  id,
  inputSize = 'medium',
  suggestions = [],
  registerOptions: _registerOptions,
  isMulti: _isMulti = true,
  ...rest
}: TagProps) => {
  const { control } = useFormContext()

  const documentContext = useContext(DocumentContext)
  const setHasChanges =
    typeof documentContext?.setHasChanges === 'function'
      ? documentContext.setHasChanges
      : undefined

  const [options, setOptions] = useState(suggestions)

  useEffect(() => {
    setOptions(suggestions)
  }, [suggestions])

  const createOption = (label: string) => ({
    label,
    value: camelCase(label)
  })

  const handleCreate = (inputValue: string) => {
    const newOption = createOption(inputValue)
    setOptions((prev) => {
      if (prev.some((option) => option.value === newOption.value)) {
        return prev
      }

      return [...prev, newOption]
    })
    setHasChanges?.(true)
    return newOption
  }

  return (
    <div className="relative">
      <FormField
        control={control}
        name={id}
        render={({ field, fieldState }) => (
          <FormItem>
            <Label htmlFor={id}>{label}</Label>
            <CreatableMultiCombobox
              id={id}
              label={label}
              value={Array.isArray(field.value) ? field.value : []}
              options={options}
              error={!!fieldState.error}
              onBlur={field.onBlur}
              onCreateOption={handleCreate}
              onChange={(nextValue) => {
                field.onChange(nextValue)
                setHasChanges?.(true)
              }}
              inputSize={inputSize}
              {...rest}
            />
            <FormDescription>{description}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
