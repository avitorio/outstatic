'use client'

import React from 'react'
import { Checkbox } from '../shadcn/checkbox'
import { Controller, useFormContext, RegisterOptions } from 'react-hook-form'
import { cn } from '../lib/utils'

interface CheckboxWithLabelProps
  extends Omit<React.ComponentPropsWithoutRef<typeof Checkbox>, 'type'> {
  id: string
  label?: string
  registerOptions?: RegisterOptions
  helperText?: string
}

export const CheckboxWithLabel = React.memo(function CheckboxWithLabel({
  id,
  label,
  registerOptions,
  helperText,
  className,
  ...checkboxProps
}: CheckboxWithLabelProps) {
  const {
    control,
    formState: { errors }
  } = useFormContext()

  const hasDescribedBy = !!(helperText || errors[id])
  const describedById = hasDescribedBy ? `${id}-description` : undefined

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Controller
          control={control}
          name={id}
          rules={registerOptions}
          render={({ field: { onChange, onBlur, value, ref } }) => (
            <Checkbox
              ref={ref}
              id={id}
              checked={!!value}
              onCheckedChange={onChange}
              onBlur={onBlur}
              aria-describedby={describedById}
              className={cn(className)}
              {...checkboxProps}
            />
          )}
        />
        <label
          htmlFor={id}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
        </label>
      </div>
      {(errors[id]?.message || helperText) && (
        <div id={describedById} className="text-sm">
          {helperText && <p className="text-muted-foreground">{helperText}</p>}
          {errors[id]?.message && (
            <p className="text-destructive">
              {errors[id]?.message?.toString()}
            </p>
          )}
        </div>
      )}
    </div>
  )
})
