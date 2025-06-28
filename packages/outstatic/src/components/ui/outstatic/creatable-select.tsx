import { forwardRef, ComponentPropsWithoutRef } from 'react'
import { cn } from '@/utils/ui'
import Creatable from 'react-select/creatable'

interface Option {
  label: string
  value: string
}

type CreatableSelectProps = {
  error?: boolean
  options: Option[]
  isClearable?: boolean
  isMulti?: boolean
  onCreateOption?: (inputValue: string) => void
} & ComponentPropsWithoutRef<Creatable>

export const CreatableSelect = forwardRef<any, CreatableSelectProps>(
  ({ error, ...props }, ref) => {
    return (
      <Creatable
        ref={ref}
        isMulti
        unstyled
        closeMenuOnSelect={false}
        classNames={{
          control: ({ isFocused }) =>
            cn(
              'flex w-full !min-h-0 rounded-md border border-input bg-background px-3 py-[3px] text-sm shadow-sm transition-colors',
              'placeholder:text-muted-foreground focus-visible:outline-none',
              'disabled:cursor-not-allowed disabled:opacity-50',
              isFocused && 'ring-1 ring-ring',
              error && 'border-destructive ring-destructive'
            ),
          placeholder: () => 'text-muted-foreground',
          input: () => 'text-sm',
          menu: () =>
            'mt-2 rounded-md border bg-popover text-popover-foreground shadow-md py-1',
          menuList: () => 'text-sm',
          option: ({ isFocused, isSelected }) =>
            cn(
              'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 outline-none transition-colors',
              isSelected && 'bg-primary text-primary-foreground',
              isFocused && !isSelected && 'bg-accent text-accent-foreground',
              !isFocused &&
                !isSelected &&
                'text-popover-foreground hover:bg-accent hover:text-accent-foreground'
            ),
          multiValue: () =>
            'inline-flex items-center bg-secondary text-secondary-foreground mr-1',
          multiValueLabel: () => 'px-2 text-xs leading-none',
          multiValueRemove: () =>
            cn(
              'flex items-center justify-center p-1',
              'hover:bg-destructive hover:text-destructive-foreground'
            ),
          valueContainer: () => 'gap-1 flex flex-wrap items-center',
          clearIndicator: () =>
            'p-1 text-muted-foreground hover:text-foreground',
          dropdownIndicator: () =>
            'p-1 text-muted-foreground hover:text-foreground',
          indicatorSeparator: () => 'bg-input mx-2 my-2 w-[1px]',
          noOptionsMessage: () => 'text-muted-foreground p-2 text-sm'
        }}
        {...props}
      />
    )
  }
)

CreatableSelect.displayName = 'CreatableSelect'
