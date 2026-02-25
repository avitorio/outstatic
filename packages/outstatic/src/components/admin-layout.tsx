import { useAuth } from '@/utils/auth/auth-provider'
import { useOutstatic } from '@/utils/hooks/use-outstatic'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export type AdminLayoutProps = {
  children: React.ReactNode
  settings?: React.ReactNode
  title?: string
  className?: string
}

export function AdminLayout({
  children,
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
            className={`w-auto flex-auto p-5 pb-0 md:p-10 bg-background h-dvh max-h-[calc(100vh-56px)] overflow-y-scroll scrollbar-hide ${
              className || ''
            }`}
          >
            {children}
          </main>
          {settings && settings}
        </>
      )}
    </>
  )
}
