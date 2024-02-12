import { BuiltWithOutstatic } from "@/components/built-with-outstatic";
import Footer from "@/components/footer";
import Header from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";
import { absoluteUrl, ogUrl } from "@/lib/utils";
import "@/styles/index.css";
import { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://outstatic.com"),
  title: {
    default: "Andre Vitorio - Design. Develop. Deploy.",
    template: "%s | Andre Vitorio",
  },
  description:
    "Design engineer from Maceió, Brazil. I write about web development, software engineering, and more.",
  openGraph: {
    title: "Andre Vitorio - Design. Develop. Deploy.",
    description:
      "Design engineer from Maceió, Brazil. I write about web development, software engineering, and more.",
    url: absoluteUrl("/"),
    siteName: "AndreVitorio.com",
    images: [
      {
        url: ogUrl("Andre Vitorio - Design. Develop. Deploy."),
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  icons: {
    icon: [{ url: "/favicon/favicon-32x32.png" }],
    apple: [{ url: "/favicon/apple-touch-icon.png" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="relative pb-56 md:pb-36 min-h-screen">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Header />
          <div className="relative max-w-6xl mx-auto px-5 h-full pt-8 md:py-24">
            {children}
          </div>
          <BuiltWithOutstatic fixed />
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
