export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html suppressHydrationWarning>
      <body id="outstatic">{children}</body>
    </html>
  )
}
