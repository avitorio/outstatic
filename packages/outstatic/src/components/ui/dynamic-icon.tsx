import * as React from 'react'
import * as lucide from 'lucide-react'
import type { LucideIcon, LucideProps } from 'lucide-react'

const kebabFromPascal = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()

const isLucideIcon = (value: unknown): value is LucideIcon =>
  typeof value === 'object' && value !== null && '$$typeof' in value

const iconEntries = Object.entries(lucide).flatMap(([exportName, Icon]) => {
  if (
    exportName.startsWith('Lucide') ||
    exportName.endsWith('Icon') ||
    !isLucideIcon(Icon)
  ) {
    return []
  }

  return [[kebabFromPascal(exportName), Icon] as const]
})

const iconsByName = Object.fromEntries(iconEntries)

export const iconNames = Object.keys(iconsByName).sort()

export type IconName = string

type DynamicIconProps = Omit<LucideProps, 'ref'> & {
  name: IconName
  fallback?: () => React.ReactNode
}

export const DynamicIcon = React.memo(
  React.forwardRef<SVGSVGElement, DynamicIconProps>(function DynamicIcon(
    { name, fallback: Fallback, ...props },
    ref
  ) {
    const Icon = iconsByName[name]

    if (!Icon) {
      return Fallback ? <>{Fallback()}</> : null
    }

    return <Icon ref={ref} {...props} />
  })
)
