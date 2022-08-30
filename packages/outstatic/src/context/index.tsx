import { createContext } from 'react'
import { PostContextType, Session } from '../types'

type OutstaticProviderProps = {
  children?: React.ReactNode
  repoSlug: string
  contentPath: string
  monorepoPath: string
  session: Session | null
  initialApolloState?: null
  contentTypes: string[]
  pages: string[]
  addPage: (page: string) => void
  removePage: (page: string) => void
}

export const OutstaticContext = createContext({
  repoSlug: '',
  contentPath: '',
  monorepoPath: '',
  session: null
} as Omit<OutstaticProviderProps, 'client'>)

export const OutstaticProvider = ({
  children,
  repoSlug,
  contentPath,
  monorepoPath,
  session,
  contentTypes,
  pages,
  addPage,
  removePage
}: OutstaticProviderProps) => {
  return (
    <OutstaticContext.Provider
      value={{
        repoSlug: repoSlug || '',
        contentPath: contentPath || 'outstatic/content',
        monorepoPath: monorepoPath || '',
        session,
        contentTypes,
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
