'use client'

import { Check, ChevronDown, Plus, X } from 'lucide-react'
import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent
} from 'react'
import { CustomFieldArrayValue } from '@/types'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList
} from '../shadcn/command'
import { Popover, PopoverAnchor, PopoverContent } from '../shadcn/popover'
import { cn } from '@/utils/ui'

type CreatableMultiComboboxProps = {
  id: string
  label?: string
  value?: CustomFieldArrayValue[]
  options?: CustomFieldArrayValue[]
  placeholder?: string
  disabled?: boolean
  readOnly?: boolean
  error?: boolean
  inputSize?: 'small' | 'medium'
  onBlur?: () => void
  onChange?: (value: CustomFieldArrayValue[]) => void
  onCreateOption?: (inputValue: string) => CustomFieldArrayValue
}

const normalize = (value: string) => value.trim().toLowerCase()

const mergeOptions = (
  ...optionGroups: Array<CustomFieldArrayValue[] | undefined>
) => {
  const optionsByValue = new Map<string, CustomFieldArrayValue>()

  optionGroups.forEach((group) => {
    group?.forEach((option) => {
      if (!option?.value) return
      optionsByValue.set(option.value, option)
    })
  })

  return Array.from(optionsByValue.values())
}

const matchesQuery = (option: CustomFieldArrayValue, query: string) => {
  const normalizedQuery = normalize(query)

  if (!normalizedQuery) return true

  return [option.label, option.value].some((value) =>
    normalize(value).includes(normalizedQuery)
  )
}

const isExactMatch = (option: CustomFieldArrayValue, query: string) => {
  const normalizedQuery = normalize(query)

  if (!normalizedQuery) return false

  return [option.label, option.value].some(
    (value) => normalize(value) === normalizedQuery
  )
}

const isSelected = (
  value: CustomFieldArrayValue[],
  option: CustomFieldArrayValue
) => value.some((selectedOption) => selectedOption.value === option.value)

export const CreatableMultiCombobox = forwardRef<
  HTMLInputElement,
  CreatableMultiComboboxProps
>(
  (
    {
      id,
      label,
      value = [],
      options = [],
      placeholder = 'Add an option',
      disabled = false,
      readOnly = false,
      error = false,
      inputSize = 'medium',
      onBlur,
      onChange,
      onCreateOption
    },
    ref
  ) => {
    const rootRef = useRef<HTMLDivElement | null>(null)
    const inputRef = useRef<HTMLInputElement | null>(null)
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [popoverWidth, setPopoverWidth] = useState<number>()
    const isOpen = !disabled && !readOnly && open

    const allOptions = mergeOptions(options, value)
    const filteredOptions = allOptions.filter((option) =>
      matchesQuery(option, query)
    )
    const exactMatch = allOptions.find((option) => isExactMatch(option, query))
    const trimmedQuery = query.trim()
    const canCreate =
      !disabled &&
      !readOnly &&
      !!onCreateOption &&
      trimmedQuery.length > 0 &&
      !exactMatch

    useEffect(() => {
      if (!open) return

      const updateWidth = () => {
        setPopoverWidth(rootRef.current?.offsetWidth)
      }

      updateWidth()
      window.addEventListener('resize', updateWidth)

      return () => window.removeEventListener('resize', updateWidth)
    }, [open, value.length])

    const assignInputRef = (node: HTMLInputElement | null) => {
      inputRef.current = node

      if (typeof ref === 'function') {
        ref(node)
        return
      }

      if (ref) {
        ref.current = node
      }
    }

    const focusInput = () => {
      inputRef.current?.focus()
    }

    const updateValue = (nextValue: CustomFieldArrayValue[]) => {
      onChange?.(nextValue)
    }

    const addOption = (option: CustomFieldArrayValue) => {
      if (isSelected(value, option)) {
        setQuery('')
        focusInput()
        return
      }

      updateValue([...value, option])
      setQuery('')
      setOpen(true)
      focusInput()
    }

    const removeOption = (option: CustomFieldArrayValue) => {
      updateValue(
        value.filter((selectedOption) => selectedOption.value !== option.value)
      )
      focusInput()
    }

    const toggleOption = (option: CustomFieldArrayValue) => {
      if (isSelected(value, option)) {
        removeOption(option)
        return
      }

      addOption(option)
    }

    const createOption = () => {
      if (!canCreate || !onCreateOption) return

      addOption(onCreateOption(trimmedQuery))
    }

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault()

        if (!trimmedQuery || disabled || readOnly) return

        if (exactMatch) {
          addOption(exactMatch)
          return
        }

        createOption()
        return
      }

      if (
        event.key === 'Backspace' &&
        query.length === 0 &&
        value.length > 0 &&
        !disabled &&
        !readOnly
      ) {
        removeOption(value[value.length - 1])
        return
      }

      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    return (
      <Popover
        open={isOpen}
        onOpenChange={(nextOpen) => {
          if (disabled || readOnly) return
          setOpen(nextOpen)
        }}
      >
        <PopoverAnchor asChild>
          <div ref={rootRef} data-tag-input-root className="relative">
            <div
              className={cn(
                'flex min-h-9 w-full flex-wrap items-center gap-1 rounded-md border border-input bg-background shadow-sm transition-[color,box-shadow]',
                'focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]',
                error &&
                  'border-destructive focus-within:border-destructive focus-within:ring-destructive/20',
                inputSize === 'small' ? 'px-2 py-1' : 'px-3 py-1.5',
                disabled && 'cursor-not-allowed opacity-50'
              )}
              onClick={() => {
                if (disabled || readOnly) return
                setOpen(true)
                focusInput()
              }}
            >
              {value.map((option) => (
                <span
                  key={option.value}
                  className="inline-flex items-center gap-1 rounded-sm bg-secondary px-2 py-1 text-xs text-secondary-foreground"
                >
                  <span className="max-w-[12rem] truncate">{option.label}</span>
                  {!readOnly ? (
                    <button
                      type="button"
                      className="rounded-sm p-0.5 hover:bg-background/80"
                      onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        removeOption(option)
                      }}
                      aria-label={`Remove ${option.label}`}
                    >
                      <X className="size-3" />
                    </button>
                  ) : null}
                </span>
              ))}
              <input
                ref={assignInputRef}
                id={id}
                type="text"
                value={query}
                disabled={disabled}
                readOnly={readOnly}
                placeholder={value.length === 0 ? placeholder : undefined}
                aria-label={label ?? id}
                className={cn(
                  'min-w-[8rem] flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground',
                  readOnly && 'min-w-0'
                )}
                onFocus={() => {
                  if (disabled || readOnly) return
                  setOpen(true)
                }}
                onBlur={onBlur}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setOpen(true)
                }}
                onKeyDown={handleKeyDown}
              />
              {!readOnly ? (
                <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
              ) : null}
            </div>
          </div>
        </PopoverAnchor>
        <PopoverContent
          align="start"
          className="p-0"
          style={popoverWidth ? { width: `${popoverWidth}px` } : undefined}
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <Command shouldFilter={false}>
            <CommandList id={`${id}-options`}>
              {canCreate ? (
                <CommandGroup>
                  <CommandItem
                    value={`create-${trimmedQuery}`}
                    onSelect={createOption}
                  >
                    <Plus className="size-4" />
                    <span>
                      Create <span className="font-medium">{trimmedQuery}</span>
                    </span>
                  </CommandItem>
                </CommandGroup>
              ) : null}
              {filteredOptions.length > 0 ? (
                <CommandGroup>
                  {filteredOptions.map((option) => {
                    const selected = isSelected(value, option)

                    return (
                      <CommandItem
                        key={option.value}
                        value={`${option.label} ${option.value}`}
                        onSelect={() => toggleOption(option)}
                      >
                        <Check
                          className={cn(
                            'size-4',
                            selected ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <span className="truncate">{option.label}</span>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              ) : !canCreate ? (
                <CommandEmpty>
                  {trimmedQuery.length > 0
                    ? 'No options found.'
                    : 'No options yet.'}
                </CommandEmpty>
              ) : null}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }
)

CreatableMultiCombobox.displayName = 'CreatableMultiCombobox'
