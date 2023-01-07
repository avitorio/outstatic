import { AppProps } from 'next/app'
import '../styles/index.css'
import 'outstatic/outstatic.css'

export default function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}
