import { ApolloError } from '@apollo/client'
import Head from 'next/head'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useOstSession } from '../../utils/auth/hooks'
import AdminHeader from '../AdminHeader'
import Sidebar from '../Sidebar'

export type AdminLayoutProps = {
  error?: string | ApolloError
  children: React.ReactNode
  settings?: React.ReactNode
  title?: string
}

export default function AdminLayout({
  children,
  error,
  settings,
  title
}: AdminLayoutProps) {
  const { session, status } = useOstSession()
  const { push } = useRouter()
  const [openSidebar, setOpenSidebar] = useState(false)
  const toggleSidebar = () => {
    setOpenSidebar(!openSidebar)
  }

  if (status === 'unauthenticated') {
    if (typeof window !== 'undefined') {
      push(`/outstatic`)
    }
    return null
  }

  return (
    <>
      <Head>
        <title>{title ? `${title} | Outstatic` : 'Outstatic'}</title>
      </Head>
      <div id="outstatic">
        {status === 'loading' ? null : (
          <div className="flex h-screen flex-col bg-white text-black">
            <AdminHeader
              {...session?.user}
              status={status}
              toggleSidebar={toggleSidebar}
            />
            <div className="flex grow flex-col-reverse justify-between md:flex-row">
              <Sidebar isOpen={openSidebar} />
              <main className="w-auto flex-auto p-5 md:p-10 bg-white max-h-[calc(100vh-53px)] overflow-y-scroll scrollbar-hide">
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
            </div>
          </div>
        )}
      </div>
    </>
  )
}
