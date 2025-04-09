'use client'

import { format } from 'date-fns'
import { cn } from '../lib/utils'
import { Button } from './button'
import { Calendar } from './calendar'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { TimePicker } from './time-picker'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from './form'
import { useFormContext } from 'react-hook-form'

export function DateTimePickerForm({
  id,
  label
}: {
  id: string
  label?: string
}) {
  const {
    control,
    formState: { errors }
  } = useFormContext()

  return (
    <FormField
      control={control}
      name={id}
      render={({ field }) => {
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
                      'justify-start text-left font-normal',
                      !field.value && 'text-muted-foreground'
                    )}
                  >
                    {field.value ? (
                      format(
                        field.value ? new Date(field.value) : new Date(),
                        'MMMM d, yyyy'
                      )
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
                  selected={field.value ? new Date(field.value) : new Date()}
                  defaultMonth={
                    field.value ? new Date(field.value) : new Date()
                  }
                  onSelect={field.onChange}
                  initialFocus
                />
                <div className="p-3 border-t border-border">
                  <TimePicker
                    setDate={field.onChange}
                    date={field.value ? new Date(field.value) : new Date()}
                  />
                </div>
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}
