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
  setCollections: Dispatch<SetStateAction<string[]>>
  pages: string[]
  addPage: (page: string) => void
  removePage: (page: string) => void
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
  collections,
  setCollections,
  pages,
  addPage,
  removePage,
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
        repoBranch: repoBranch || 'main',
        contentPath: contentPath || 'outstatic/content',
        monorepoPath: monorepoPath || '',
        session,
        collections,
        setCollections,
        pages,
        addPage,
        removePage,
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
