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
  initialApolloState?: null
  collections: string[]
  pages: string[]
  addPage: (page: string) => void
  removePage: (page: string) => void
  hasOpenAIKey: boolean
  hasChanges: boolean
  setHasChanges: Dispatch<SetStateAction<boolean>>
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
  collections,
  pages,
  addPage,
  removePage,
  hasOpenAIKey,
  hasChanges,
  setHasChanges
}: OutstaticProviderProps) => {
  return (
    <OutstaticContext.Provider
      value={{
        repoOwner: repoOwner || '',
        repoSlug: repoSlug || '',
        repoBranch: repoBranch || 'main',
        contentPath: contentPath || 'outstatic/content',
        monorepoPath: monorepoPath || '',
        session,
        collections,
        pages,
        addPage,
        removePage,
        hasOpenAIKey,
        hasChanges,
        setHasChanges
      }}
    >
      {children}
    </OutstaticContext.Provider>
  )
}

export const DocumentContext = createContext<DocumentContextType>(
  {} as DocumentContextType
)
