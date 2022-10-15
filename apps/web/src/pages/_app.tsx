import '../styles/globals.css'
import '../styles/prose.css'
import '../styles/dracula.css'

import type { AppProps } from 'next/app'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import * as gtag from '../lib/analytics'
import Analytics from '../components/Analytics'

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter()

  useEffect(() => {
    const handleRouteChange = (url: URL) => {
      gtag.pageview(url)
    }
    router.events.on('routeChangeComplete', handleRouteChange)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router.events])

  return (
    <>
      <Analytics />
      <Component {...pageProps} />
    </>
  )
}

export default MyApp
