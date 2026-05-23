import * as React from 'react'

type DynamicIconProps = {
  name: string
  fallback?: () => React.ReactNode
} & React.SVGProps<SVGSVGElement>

export const DynamicIcon = React.forwardRef<SVGSVGElement, DynamicIconProps>(
  function DynamicIcon({ name, fallback: _fallback, ...rest }, ref) {
    return (
      <svg
        ref={ref}
        data-testid="lucide-dynamic-icon"
        data-name={name}
        {...rest}
      />
    )
  }
)

export const iconNames: string[] = []
export const dynamicIconImports: Record<string, () => Promise<unknown>> = {}

export type IconName = string
export type DynamicIconModule = unknown

export default DynamicIcon
