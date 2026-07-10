'use client'

import { format } from 'date-fns'
import { cn } from '@/utils/ui'
import { Button } from '@/components/ui/shadcn/button'
import { Calendar } from '@/components/ui/shadcn/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/shadcn/popover'
import { TimePicker } from '@/components/ui/shadcn/time-picker'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/shadcn/form'
import { useFormContext } from 'react-hook-form'
import { isValidCalendarDate, toCalendarDate } from '@/utils/calendar-date'

export function DateTimePickerForm({
  id,
  label,
  description
}: {
  id: string
  label?: string
  description?: string
}) {
  const { control } = useFormContext()

  return (
    <FormField
      control={control}
      name={id}
      render={({ field }) => {
        const parsedDate = field.value ? toCalendarDate(field.value) : undefined
        const selectedDate =
          parsedDate && isValidCalendarDate(parsedDate) ? parsedDate : undefined

        return (
          <FormItem className="flex flex-col">
            {label ? (
              <FormLabel className="text-left">{label}</FormLabel>
            ) : null}
            <Popover>
              <FormControl>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'justify-start text-left font-normal w-full',
                      !selectedDate && 'text-muted-foreground'
                    )}
                  >
                    {selectedDate ? (
                      format(selectedDate, 'MMMM d, yyyy')
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
              </FormControl>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  captionLayout="dropdown"
                  fromYear={new Date().getFullYear() - 100}
                  toYear={new Date().getFullYear() + 10}
                  mode="single"
                  selected={selectedDate}
                  defaultMonth={selectedDate ?? new Date()}
                  onSelect={field.onChange}
                  initialFocus
                />
                <div className="p-3 border-t border-border">
                  <TimePicker
                    setDate={field.onChange}
                    date={selectedDate ?? new Date()}
                  />
                </div>
              </PopoverContent>
            </Popover>
            {description ? (
              <FormDescription>{description}</FormDescription>
            ) : null}
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}
