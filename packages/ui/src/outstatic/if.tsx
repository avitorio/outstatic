import { useMemo } from 'react'

type Condition<Value = unknown> = Value | false | null | undefined | 0 | ''

export function If<Value = unknown>({
  condition,
  children,
  fallback
}: React.PropsWithoutRef<{
  condition: Condition<Value>
  children: React.ReactNode | ((value: Value) => React.ReactNode)
  fallback?: React.ReactNode
}>) {
  return useMemo(() => {
    if (condition) {
      if (typeof children === 'function') {
        return <>{children(condition)}</>
      }

      return <>{children}</>
    }

    if (fallback) {
      return <>{fallback}</>
    }

    return null
  }, [condition, fallback, children])
}
