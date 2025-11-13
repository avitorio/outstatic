import { useAuth } from '@/utils/auth/auth-provider'
import { useOutstatic } from '@/utils/hooks/useOutstatic'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export type AdminLayoutProps = {
  error?: string
  children: React.ReactNode
  settings?: React.ReactNode
  title?: string
  className?: string
}

export function AdminLayout({
  children,
  error,
  settings,
  title,
  className
}: AdminLayoutProps) {
  const { dashboardRoute } = useOutstatic()
  const { status } = useAuth()
  const { push } = useRouter()

  useEffect(() => {
    const pageTitle = title ? `${title} | Outstatic` : 'Outstatic'
    document.title = pageTitle
  }, [title])

  useEffect(() => {
    if (status === 'unauthenticated' && typeof window !== 'undefined') {
      // Defer navigation to avoid updating Router during render
      setTimeout(() => {
        push(dashboardRoute)
      }, 0)
    }
  }, [status, dashboardRoute, push])

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <>
      {status === 'loading' ? null : (
        <>
          <main
            className={`w-auto flex-auto p-5 pb-0 md:p-10 bg-background h-dvh max-h-[calc(100vh-56px)] overflow-y-scroll scrollbar-hide ${className || ''
              }`}
          >
            {error && (
              <div className="mb-6 border border-red-500 p-2">
                Something went wrong{' '}
                <span role="img" aria-label="sad face">
                  😓
                </span>
              </div>
            )}
            {children}
          </main>
          {settings && settings}
        </>
      )}
    </>
  )
}
