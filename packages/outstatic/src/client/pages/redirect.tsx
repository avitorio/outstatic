import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shadcn/card'
import LoadingBackground from '@/components/ui/outstatic/loading-background'
import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { OUTSTATIC_APP_URL } from '@/utils/constants'

export default function RedirectingPage() {
  useEffect(() => {
    document.title = 'Redirecting...'
  }, [])

  const redirectToParam = useSearchParams().get('redirectTo') || OUTSTATIC_APP_URL

  // Validate redirect URL
  const redirectTo = useMemo(() => {
    try {
      const url = new URL(redirectToParam)
      const currentOrigin = window.location.origin
      const allowedOrigins = [currentOrigin, OUTSTATIC_APP_URL]

      if (allowedOrigins.includes(url.origin)) {
        return url.href
      }
    } catch {
      // Invalid URL
    }
    return OUTSTATIC_APP_URL
  }, [redirectToParam])

  useEffect(() => {
    setTimeout(() => {
      window.location.href = redirectTo
    }, 3000)
  }, [redirectTo])

  return (
    <>
      <div id="outstatic">
        <LoadingBackground isLoading={true}>
          <main className="relative z-10 flex h-screen items-center justify-center p-4">
            <Card>
              <CardContent>
                <CardHeader className="px-0">
                  <CardTitle>Redirecting to Outstatic.com</CardTitle>
                </CardHeader>
                <CardDescription>
                  You will be redirected to the Outstatic App in a few seconds.
                </CardDescription>
              </CardContent>
            </Card>
          </main>
        </LoadingBackground>
      </div>
    </>
  )
}
