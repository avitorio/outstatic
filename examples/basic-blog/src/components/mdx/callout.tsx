import { ReactNode } from 'react'

type CalloutType = 'info' | 'warning' | 'success'

type CalloutProps = {
  title?: string
  type?: CalloutType
  children?: ReactNode
}

const styles: Record<CalloutType, string> = {
  info: 'border-blue-300 bg-blue-50 text-blue-900',
  warning: 'border-amber-300 bg-amber-50 text-amber-900',
  success: 'border-emerald-300 bg-emerald-50 text-emerald-900'
}

const icons: Record<CalloutType, string> = {
  info: 'ℹ',
  warning: '⚠',
  success: '✓'
}

export default function Callout({
  title,
  type = 'info',
  children
}: CalloutProps) {
  return (
    <div
      className={`not-prose my-6 flex gap-3 rounded-lg border p-4 ${styles[type]}`}
    >
      <div className="text-xl leading-none">{icons[type]}</div>
      <div className="flex-1">
        {title ? <div className="font-semibold mb-1">{title}</div> : null}
        <div className="text-sm leading-relaxed">{children}</div>
      </div>
    </div>
  )
}
