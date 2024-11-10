import { BuiltWithOutstatic } from '@/components/built-with-outstatic'
import { ThemeProvider } from '@/components/theme-provider'
import '@/styles/style.css'
import { Metadata } from 'next'
import Script from 'next/script'

export const metadata: Metadata = {
  metadataBase: new URL('https://outstatic.com'),
  title: 'Outstatic - A Static Site CMS for Next.js',
  description:
    'An open source static site CMS for Next.js. Create your blog or website in minutes. No database needed.',
  openGraph: {
    title: 'Outstatic - A Static Site CMS for Next.js',
    description:
      'An open source static site CMS for Next.js. Create your blog or website in minutes. No database needed.',
    url: 'https://outstatic.com',
    siteName: 'Next.js',
    images: [
      {
        url: 'https://outstatic.com/images/og-image.png',
        width: 1800,
        height: 1600,
        alt: 'Outstatic - a static CMS for Next.js'
      }
    ],
    locale: 'en_US',
    type: 'website'
  },
  icons: {
    icon: [{ url: '/favicon/favicon-32x32.png' }],
    apple: [{ url: '/favicon/apple-touch-icon.png' }]
  }
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {process.env.NEXT_PUBLIC_TINYBIRD_TOKEN ? (
          <Script
            defer
            src="https://unpkg.com/@tinybirdco/flock.js"
            data-host="https://api.tinybird.co"
            data-token={process.env.NEXT_PUBLIC_TINYBIRD_TOKEN}
          />
        ) : null}
      </head>
      <body id="outstatic" className="bg-background relative">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <BuiltWithOutstatic />
        </ThemeProvider>
      </body>
    </html>
  )
}
