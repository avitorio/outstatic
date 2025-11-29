import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shadcn/card'
import LoadingBackground from '@/components/ui/outstatic/loading-background'
import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { OUTSTATIC_APP_URL } from '@/utils/constants'

export default function RedirectingPage({
}) {
  useEffect(() => {
    document.title = 'Redirecting...'
  }, [])

  const redirectTo = useSearchParams().get('redirectTo') || OUTSTATIC_APP_URL
  useEffect(() => {
    setTimeout(() => {
      window.location.href = redirectTo
    }, 4000)
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
