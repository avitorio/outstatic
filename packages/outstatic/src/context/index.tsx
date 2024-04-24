import { DocumentContextType, Session } from '@/types'
import { Dispatch, SetStateAction, createContext } from 'react'

type OutstaticProviderProps = {
  children?: React.ReactNode
  repoOwner: string
  repoSlug: string
  repoBranch: string
  contentPath: string
  monorepoPath: string
  session: Session | null
  pages: string[]
  hasOpenAIKey: boolean
  hasChanges: boolean
  setHasChanges: Dispatch<SetStateAction<boolean>>
  basePath: string
}

export const OutstaticContext = createContext<OutstaticProviderProps>(
  {} as OutstaticProviderProps
)

export const OutstaticProvider = ({
  children,
  repoOwner,
  repoSlug,
  repoBranch,
  contentPath,
  monorepoPath,
  session,
  hasOpenAIKey,
  hasChanges,
  setHasChanges,
  basePath
}: OutstaticProviderProps) => {
  return (
    <OutstaticContext.Provider
      value={{
        repoOwner: repoOwner || '',
        repoSlug: repoSlug || '',
        repoBranch: repoBranch || '',
        contentPath: contentPath || '',
        monorepoPath: monorepoPath || '',
        session,
        pages: ['collections', 'settings'],
        hasOpenAIKey,
        hasChanges,
        setHasChanges,
        basePath: basePath || ''
      }}
    >
      {children}
    </OutstaticContext.Provider>
  )
}

export const DocumentContext = createContext<DocumentContextType>(
  {} as DocumentContextType
)
