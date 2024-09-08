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

export function SearchCombobox({
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
  scrollFooter
}: {
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
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[287px] justify-between"
          disabled={disabled || isLoading}
        >
          {isLoading
            ? loadingPlaceholder
            : value
            ? data.find((dataRecord) => dataRecord.value === value)?.label
            : selectPlaceholder}
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[287px] p-0 md:w-[287px]">
        <Command>
          <CommandInput
            placeholder={isLoading ? loadingPlaceholder : searchPlaceholder}
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
                      setValue(currentValue === value ? '' : currentValue)
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
  )
}
