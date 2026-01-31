'use client'
import { OutstaticData } from '@/app'
import { V2BreakingCheck } from '@/components/v2-breaking-check'
import {
  InitialDataContext,
  setSessionUpdateCallback
} from '@/utils/hooks/useInitialData'
import { AuthProvider, useAuth } from '@/utils/auth/auth-provider'
import { queryClient } from '@/utils/react-query/queryClient'
import { QueryClientProvider } from '@tanstack/react-query'
import { NavigationGuardProvider } from 'next-navigation-guard'
import { ThemeProvider } from 'next-themes'
import { ReactNode, useEffect, useMemo, useCallback } from 'react'
import { Toaster } from 'sonner'
import 'katex/dist/katex.min.css'

type RootProviderProps = {
  ostData: OutstaticData
  children: ReactNode
}

// Inner component that uses the AuthProvider context
function RootProviderInner({ ostData, children }: RootProviderProps) {
  const { session, updateSession } = useAuth()

  // Derive currentOstData from ostData and session
  const currentOstData = useMemo(
    () => ({ ...ostData, session }),
    [ostData, session]
  )

  // Set up session update callback for token refresh interceptor
  const handleSessionUpdate = useCallback(
    (newSession: any) => {
      updateSession(newSession)
    },
    [updateSession]
  )

  useEffect(() => {
    setSessionUpdateCallback(handleSessionUpdate)
  }, [handleSessionUpdate])

  return (
    <InitialDataContext.Provider value={currentOstData}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <Toaster />
        <QueryClientProvider client={queryClient}>
          <NavigationGuardProvider>{children}</NavigationGuardProvider>
        </QueryClientProvider>
        <V2BreakingCheck />
      </ThemeProvider>
    </InitialDataContext.Provider>
  )
}

// Outer provider that wraps with AuthProvider
export const RootProvider = ({ ostData, children }: RootProviderProps) => {
  return (
    <AuthProvider initialSession={ostData.session} basePath={ostData.basePath}>
      <RootProviderInner ostData={ostData}>{children}</RootProviderInner>
    </AuthProvider>
  )
}
