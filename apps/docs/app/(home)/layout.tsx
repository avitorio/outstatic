import { VersionedSearchDialog } from '@/components/versioned-search-dialog'
import { RootProvider } from 'fumadocs-ui/provider/next'
import './global.css'
import { Inter } from 'next/font/google'
import type { Metadata } from 'next'
import { docsBaseRoute } from '@/lib/shared'

export const metadata: Metadata = {
  icons: {
    icon: [{ url: `${docsBaseRoute}/favicon/favicon-96x96.png` }],
    apple: [{ url: `${docsBaseRoute}/favicon/apple-touch-icon.png` }]
  }
}

const inter = Inter({
  subsets: ['latin']
})

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider
          search={{
            SearchDialog: VersionedSearchDialog,
            options: {
              api: `${docsBaseRoute}/api/search`
            }
          }}
        >
          {children}
        </RootProvider>
      </body>
    </html>
  )
}
