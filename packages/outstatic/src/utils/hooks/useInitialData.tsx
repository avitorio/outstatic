import { OutstaticData } from '@/app'
import { createContext, useContext } from 'react'

export const InitialDataContext = createContext<OutstaticData>(
  {} as OutstaticData
)

export const useInitialData = () => {
  return useContext(InitialDataContext)
}
