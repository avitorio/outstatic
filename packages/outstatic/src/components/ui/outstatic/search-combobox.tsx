'use client'

import * as React from 'react'

import { CaretSortIcon } from '@radix-ui/react-icons'
import { CommandList } from 'cmdk'
import { LucideIcon } from 'lucide-react'

import { Button } from '../shadcn/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem
} from '../shadcn/command'
import { Popover, PopoverContent, PopoverTrigger } from '../shadcn/popover'
import { cn } from '@/utils/ui'

export function SearchCombobox({
  className,
  data,
  value,
  setValue,
  onValueChange,
  isLoading = false,
  disabled = false,
  selectPlaceholder = 'Select',
  searchPlaceholder = 'Search',
  resultsPlaceholder = 'No results found',
  loadingPlaceholder = 'Loading...',
  scrollFooter,
  isOpen,
  onOpenChange,
  variant = 'outline',
  size = 'default'
}: {
  className?: string
  data: {
    value: string
    label: string
    icon?: LucideIcon
  }[]
  value: string
  setValue: (value: string) => void
  onValueChange?: (value: string) => void
  isLoading?: boolean
  disabled?: boolean
  selectPlaceholder?: string
  searchPlaceholder?: string
  resultsPlaceholder?: string
  loadingPlaceholder?: string
  scrollFooter?: () => React.ReactNode
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  variant?: React.ComponentProps<typeof Button>['variant'] | 'hidden'
  size?: React.ComponentProps<typeof Button>['size']
}) {
  const [internalOpen, setInternalOpen] = React.useState(false)

  const open = isOpen !== undefined ? isOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen

  const buttonClassName = cn(
    'justify-between',
    size === 'sm' ? 'w-min px-1 ml-0.5' : 'w-full min-w-[20rem]',
    variant === 'hidden' ? 'hidden' : '',
    className
  )

  return (
    <div className={cn('flex items-center', size !== 'sm' && 'w-full')}>
      {size === 'sm' ? (
        <span
          className={cn(
            'truncate text-left hidden lg:flex',
            size === 'sm' ? 'w-min text-sm mr-1 font-medium' : 'w-[20rem]'
          )}
        >
          {isLoading
            ? loadingPlaceholder
            : value
              ? (() => {
                  const selectedRecord = data.find(
                    (dataRecord) => dataRecord.value === value
                  )
                  return (
                    <>
                      {selectedRecord?.icon && (
                        <selectedRecord.icon className="h-4 w-4 inline-block" />
                      )}
                      {selectedRecord?.label}
                    </>
                  )
                })()
              : selectPlaceholder}
        </span>
      ) : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={variant === 'hidden' ? undefined : variant}
            role="combobox"
            aria-expanded={open}
            className={cn(
              buttonClassName,
              size === 'sm' &&
                'focus-visible:outline-hidden focus-visible:ring-0 focus-visible:ring-offset-0 px-1'
            )}
            disabled={disabled}
            size={size}
          >
            <span
              className={cn(
                'truncate text-left',
                size === 'sm' ? 'w-min lg:hidden' : 'flex-1 min-w-0'
              )}
            >
              {isLoading
                ? loadingPlaceholder
                : value
                  ? (() => {
                      const selectedRecord = data.find(
                        (dataRecord) => dataRecord.value === value
                      )
                      return (
                        <>
                          {selectedRecord?.icon && (
                            <selectedRecord.icon className="h-4 w-4 inline-block" />
                          )}
                          {selectedRecord?.label}
                        </>
                      )
                    })()
                  : selectPlaceholder}
            </span>
            <div>
              <CaretSortIcon className={cn('h-4 w-4 shrink-0 opacity-50')} />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={cn(
            'w-[var(--radix-popover-trigger-width)] p-0',
            size === 'sm' && 'min-w-[20rem]'
          )}
          align={size === 'sm' ? 'start' : 'center'}
          style={{ width: 'var(--radix-popover-trigger-width)' }}
        >
          <Command className="max-h-[275px]">
            <CommandInput
              placeholder={searchPlaceholder}
              onValueChange={onValueChange}
            />
            <CommandEmpty>
              {isLoading ? loadingPlaceholder : resultsPlaceholder}
            </CommandEmpty>
            <CommandList className="max-h-[200px] overflow-y-auto">
              <CommandGroup>
                {data.map((dataRecord) => (
                  <CommandItem
                    key={dataRecord.value}
                    value={dataRecord.value}
                    onSelect={(currentValue) => {
                      if (currentValue !== value) {
                        setValue(currentValue)
                      }
                      setOpen(false)
                    }}
                  >
                    {dataRecord.icon && (
                      <dataRecord.icon className="mr-2 h-4 w-4 shrink-0" />
                    )}
                    <span>{dataRecord.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
            {scrollFooter ? scrollFooter() : null}
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
