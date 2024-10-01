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
import { ScrollArea } from '../shadcn/scroll-area'
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
  variant?: React.ComponentProps<typeof Button>['variant']
  size?: React.ComponentProps<typeof Button>['size']
}) {
  const [internalOpen, setInternalOpen] = React.useState(false)

  const open = isOpen !== undefined ? isOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen

  const buttonClassName = cn(
    'justify-between',
    size === 'sm' ? 'w-min px-1 ml-0.5' : 'w-[20rem]',
    className
  )

  return (
    <div className="flex items-center">
      {size === 'sm' ? (
        <span
          className={cn(
            'truncate text-left',
            size === 'sm' ? 'w-min text-sm font-medium' : 'w-[20rem]'
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
                      <selectedRecord.icon className="mr-2 h-4 w-4 inline-block" />
                    )}
                    {selectedRecord?.label}
                  </>
                )
              })()
            : selectPlaceholder}
        </span>
      ) : null}
      <Popover open={open} onOpenChange={setOpen} modal>
        <PopoverTrigger asChild>
          <Button
            variant={variant}
            role="combobox"
            aria-expanded={open}
            className={buttonClassName}
            disabled={disabled || isLoading}
            size={size}
          >
            <span
              className={cn(
                'truncate text-left',
                size === 'sm' ? 'w-min' : 'w-[20rem]'
              )}
            >
              {size !== 'sm'
                ? isLoading
                  ? loadingPlaceholder
                  : value
                  ? (() => {
                      const selectedRecord = data.find(
                        (dataRecord) => dataRecord.value === value
                      )
                      return (
                        <>
                          {selectedRecord?.icon && (
                            <selectedRecord.icon className="mr-2 h-4 w-4 inline-block" />
                          )}
                          {selectedRecord?.label}
                        </>
                      )
                    })()
                  : selectPlaceholder
                : null}
            </span>
            <CaretSortIcon
              className={cn(
                'h-4 w-4 shrink-0 opacity-50',
                size !== 'sm' && 'ml-2'
              )}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[20rem] p-0 md:w-[20rem]"
          align={size === 'sm' ? 'start' : 'center'}
        >
          <Command className="max-h-[275px]">
            <CommandInput
              placeholder={searchPlaceholder}
              onValueChange={onValueChange}
            />
            <CommandEmpty>
              {isLoading ? loadingPlaceholder : resultsPlaceholder}
            </CommandEmpty>
            <ScrollArea className="h-[200px]">
              <CommandList>
                <CommandGroup>
                  {data.map((dataRecord) => (
                    <CommandItem
                      key={dataRecord.value}
                      value={dataRecord.value}
                      onSelect={(currentValue) => {
                        setValue(currentValue)
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
            </ScrollArea>
            {scrollFooter ? scrollFooter() : null}
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
