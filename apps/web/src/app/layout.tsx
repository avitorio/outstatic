import '@/styles/globals.css'
import '@/styles/prose.css'
import '@/styles/dracula.css'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Outstatic - A Static Site CMS for Next.js',
  description:
    'An open source static site CMS for Next.js. Create your blog or website in minutes. No dabatase needed.',
  openGraph: {
    type: 'website',
    description:
      'An open source static site CMS for Next.js. Create your blog or website in minutes. No dabatase needed.'
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
