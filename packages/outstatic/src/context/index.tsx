import { createContext } from 'react'
import { PostContextType, Session } from '../types'

type OutstaticProviderProps = {
  children?: React.ReactNode
  repoOwner: string
  repoSlug: string
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
  contentPath: '',
  monorepoPath: '',
  session: null
} as Omit<OutstaticProviderProps, 'client'>)

export const OutstaticProvider = ({
  children,
  repoOwner,
  repoSlug,
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

export const PostContext = createContext<PostContextType>({} as PostContextType)
