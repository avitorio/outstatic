type AlertProps = {
  type: 'success' | 'error' | 'warning' | 'info'
  children: React.ReactNode
}

const alertStyles = {
  success: 'text-green-700 bg-green-100',
  info: 'text-blue-700 bg-blue-100',
  error: 'text-red-700 bg-red-100',
  warning: 'text-yellow-700 bg-yellow-100'
}

const Alert = ({ type, children }: AlertProps) => {
  return (
    <div
      className={`inline-block p-4 mb-4 text-sm rounded-lg ${alertStyles[type]}`}
      role="alert"
    >
      {children}
    </div>
  )
}

export default Alert
