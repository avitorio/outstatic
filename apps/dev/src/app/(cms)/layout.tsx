export const metadata = {
  title: 'Outstatic'
}

import { ThemeProvider } from "@/components/theme-provider"

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body id="outstatic">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
        {children}
        </ThemeProvider>
        </body>
    </html>
  )
}
