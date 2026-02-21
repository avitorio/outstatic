import { OutstaticData } from '@/app'
import { createContext, useContext } from 'react'

export const InitialDataContext = createContext<OutstaticData>(
  {} as OutstaticData
)

// Global callback for session updates (set by RootProvider)
let sessionUpdateCallback: ((session: any) => void) | null = null

export const setSessionUpdateCallback = (callback: (session: any) => void) => {
  sessionUpdateCallback = callback
}

export const getSessionUpdateCallback = () => sessionUpdateCallback

export const useInitialData = () => {
  return useContext(InitialDataContext)
}
