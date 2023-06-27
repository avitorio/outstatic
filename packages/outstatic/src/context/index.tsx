import { createContext } from 'react'
import { DocumentContextType, Session } from '../types'

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
}

export const OutstaticContext = createContext({
  repoOwner: '',
  repoSlug: '',
  repoBranch: '',
  contentPath: '',
  monorepoPath: '',
  session: null
} as Omit<OutstaticProviderProps, 'client'>)

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
  removePage
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
        removePage
      }}
    >
      {children}
    </OutstaticContext.Provider>
  )
}

export const DocumentContext = createContext<DocumentContextType>(
  {} as DocumentContextType
)
