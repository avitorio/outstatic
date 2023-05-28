import '../styles/index.css'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Outstatic',
    template: '%s | Outstatic'
  },
  description: 'A blog starter built with Outstatic.'
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
