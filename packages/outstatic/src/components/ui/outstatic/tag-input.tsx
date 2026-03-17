import { CustomFieldArrayValue } from '@/types'
import { camelCase } from 'change-case'
import { useContext, useState } from 'react'
import { RegisterOptions, useFormContext } from 'react-hook-form'
import { DocumentContext } from '@/context'
import {
  FormMessage,
  FormDescription,
  FormItem,
  FormField
} from '../shadcn/form'
import { Label } from '../shadcn/label'
import { CreatableSelect } from './creatable-select'

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
  isMulti = true,
  ...rest
}: TagProps) => {
  const {
    control,
    getValues,
    setValue,
    formState: { errors }
  } = useFormContext()

  const documentContext = useContext(DocumentContext)
  const setHasChanges =
    typeof documentContext?.setHasChanges === 'function'
      ? documentContext.setHasChanges
      : undefined

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
    setHasChanges?.(true)
  }

  return (
    <div className="relative" data-tag-input-root>
      <FormField
        control={control}
        name={id}
        render={({ field }) => (
          <FormItem>
            <Label htmlFor={id}>{label}</Label>
            <CreatableSelect
              isMulti
              onCreateOption={handleCreate}
              isClearable={false}
              options={options}
              error={!!errors[id]?.message}
              {...rest}
              {...field}
            />
            <FormDescription>{description}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
