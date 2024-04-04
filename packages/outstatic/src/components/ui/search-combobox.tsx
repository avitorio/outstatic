'use client'

import { Check, ChevronsUpDown } from 'lucide-react'
import * as React from 'react'

import { Button } from './button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem
} from './command'
import { CommandList } from 'cmdk'
import { ScrollArea } from './scroll-area'
import { cn } from '@/utils/ui'
import { Popover, PopoverContent, PopoverTrigger } from './popover'

export function SearchCombobox({
  data,
  value,
  setValue,
  onValueChange,
  isLoading = false
}: {
  data: { value: string; label: string }[]
  value: string
  setValue: (value: string) => void
  onValueChange: (value: string) => void
  isLoading?: boolean
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[320px] font-normal justify-between"
        >
          {value
            ? data.find((dataRecord) => dataRecord.value === value)?.label
            : 'Select a repository'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0">
        <Command>
          <CommandInput
            placeholder="Search repository"
            onValueChange={onValueChange}
            isLoading={isLoading}
          />
          <CommandEmpty>No repository selected</CommandEmpty>
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
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === dataRecord.value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span>{dataRecord.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </ScrollArea>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
