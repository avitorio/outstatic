import { DocumentContextType } from '@/types'
import { createContext } from 'react'

export const DocumentContext = createContext<DocumentContextType>(
  {} as DocumentContextType
)
