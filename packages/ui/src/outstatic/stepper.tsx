'use client'

import { Fragment, useCallback } from 'react'

import { cva } from 'class-variance-authority'

import { cn } from '../lib/utils'
import { If } from './if'

type Variant = 'numbers' | 'default' | 'dots'

const classNameBuilder = getClassNameBuilder()

/**
 * Renders a stepper component with multiple steps.
 *
 * @param {Object} props - The props object containing the following properties:
 *   - steps {string[]} - An array of strings representing the step labels.
 *   - currentStep {number} - The index of the currently active step.
 *   - variant {string} (optional) - The variant of the stepper component (default: 'default').
 **/
export function Stepper(props: {
  steps: string[]
  currentStep: number
  variant?: Variant
}) {
  const variant = props.variant ?? 'default'

  const Steps = useCallback(() => {
    return props.steps.map((labelOrKey, index) => {
      const selected = props.currentStep === index
      const complete = props.currentStep > index

      const className = classNameBuilder({
        selected,
        variant,
        complete
      })

      const isNumberVariant = variant === 'numbers'
      const isDotsVariant = variant === 'dots'

      const labelClassName = cn({
        ['text-xs px-1.5 py-2']: !isNumberVariant,
        ['hidden']: isDotsVariant
      })

      const { label, number } = getStepLabel(labelOrKey, index)

      return (
        <Fragment key={index}>
          <div aria-selected={selected} className={className}>
            <span className={labelClassName}>
              {number}
              <If condition={!isNumberVariant}>. {label}</If>
            </span>
          </div>

          <If condition={isNumberVariant}>
            <StepDivider selected={selected} complete={complete}>
              {label}
            </StepDivider>
          </If>
        </Fragment>
      )
    })
  }, [props.steps, props.currentStep, variant])

  // If there are no steps, don't render anything.
  if (props.steps.length < 2) {
    return null
  }

  const containerClassName = cn('w-full', {
    ['flex justify-between']: variant === 'numbers',
    ['flex space-x-0.5']: variant === 'default',
    ['flex space-x-2.5 self-center']: variant === 'dots'
  })

  return (
    <div className={containerClassName}>
      <Steps />
    </div>
  )
}

function getClassNameBuilder() {
  return cva(``, {
    variants: {
      variant: {
        default: `flex flex-col h-[2.5px] w-full transition-all duration-500`,
        numbers:
          'w-9 h-9 font-bold rounded-full flex items-center justify-center text-sm border',
        dots: 'w-2.5 h-2.5 rounded-full bg-muted transition-colors'
      },
      selected: {
        true: '',
        false: 'hidden sm:flex'
      },
      complete: {
        true: '',
        false: ''
      }
    },
    compoundVariants: [
      {
        variant: 'default',
        selected: false,
        className: 'text-muted-foreground'
      },
      {
        variant: 'default',
        selected: true,
        className: 'bg-primary font-medium'
      },
      {
        variant: 'default',
        selected: false,
        complete: false,
        className: 'bg-muted'
      },
      {
        variant: 'default',
        selected: false,
        complete: true,
        className: 'bg-primary'
      },
      {
        variant: 'numbers',
        selected: false,
        complete: true,
        className: 'border-primary text-primary'
      },
      {
        variant: 'numbers',
        selected: true,
        className: 'border-primary bg-primary text-primary-foreground'
      },
      {
        variant: 'numbers',
        selected: false,
        className: 'text-muted-foreground'
      },
      {
        variant: 'dots',
        selected: true,
        complete: true,
        className: 'bg-primary'
      },
      {
        variant: 'dots',
        selected: false,
        complete: true,
        className: 'bg-primary'
      },
      {
        variant: 'dots',
        selected: true,
        complete: false,
        className: 'bg-primary'
      },
      {
        variant: 'dots',
        selected: false,
        complete: false,
        className: 'bg-muted'
      }
    ],
    defaultVariants: {
      variant: 'default',
      selected: false
    }
  })
}

function StepDivider({
  selected,
  complete,
  children
}: React.PropsWithChildren<{
  selected: boolean
  complete: boolean
}>) {
  const spanClassName = cn('font-medium text-sm min-w-max', {
    ['text-muted-foreground hidden sm:flex']: !selected,
    ['text-secondary-foreground']: selected || complete,
    ['font-medium']: selected
  })

  const className = cn(
    'flex flex-1 last:flex-[0_0_0] items-center h-9 justify-center' +
      ' items-center w-full group px-3 flex space-x-3'
  )

  return (
    <div className={className}>
      <span className={spanClassName}>{children}</span>

      <div
        className={
          'divider h-[1px] w-full bg-gray-200 transition-colors' +
          ' hidden group-last:hidden dark:bg-border sm:flex'
        }
      />
    </div>
  )
}

function getStepLabel(labelOrKey: string, index: number) {
  const number = (index + 1).toString()

  return {
    number,
    label: labelOrKey
  }
}
