import { VersionedSearchDialog } from '@/components/versioned-search-dialog'
import { RootProvider } from 'fumadocs-ui/provider/next'
import './global.css'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import { docsBaseRoute } from '@/lib/shared'

const inter = Inter({
  subsets: ['latin']
})

const UMAMI_WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID
const UMAMI_HOST_URL =
  process.env.NEXT_PUBLIC_UMAMI_HOST_URL ?? 'https://outstatic.com'
const UMAMI_DOMAINS = process.env.NEXT_PUBLIC_UMAMI_DOMAINS ?? 'outstatic.com'

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <UmamiAnalytics />
        <RootProvider
          search={{
            SearchDialog: VersionedSearchDialog,
            options: {
              api: `${docsBaseRoute}/api/search`,
            },
          }}
        >
          {children}
        </RootProvider>
      </body>
    </html>
  )
}

function UmamiAnalytics() {
  if (!UMAMI_WEBSITE_ID) {
    return null
  }

  return (
    <Script
      src="/stats/script.js"
      data-website-id={UMAMI_WEBSITE_ID}
      data-host-url={UMAMI_HOST_URL}
      data-domains={UMAMI_DOMAINS}
      strategy="afterInteractive"
    />
  )
}
