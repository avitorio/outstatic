import '@/styles/globals.css'
import '@/styles/prose.css'
import '@/styles/dracula.css'
import { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://outstatic.com'),
  title: 'Outstatic - A Static Site CMS for Next.js',
  description:
    'An open source static site CMS for Next.js. Create your blog or website in minutes. No dabatase needed.',
  openGraph: {
    title: 'Outstatic - A Static Site CMS for Next.js',
    description:
      'An open source static site CMS for Next.js. Create your blog or website in minutes. No dabatase needed.',
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
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
