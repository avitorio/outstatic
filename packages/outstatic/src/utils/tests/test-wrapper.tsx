import { SidebarProvider } from '@/components/ui/shadcn/sidebar'
import { DocumentContext } from '@/context'
import {
  CreateCommitDocument,
  DocumentDocument,
  OidDocument
} from '@/graphql/gql/graphql'
import { Document, DocumentContextType } from '@/types'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Editor, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { NavigationGuardProvider } from 'next-navigation-guard'
import { ReactNode } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

export const documentExample: Document = {
  publishedAt: new Date('2022-07-14'),
  title: 'Example Document',
  content: 'Example Content',
  status: 'published',
  slug: 'document-example',
  author: {
    name: 'John Doe',
    picture: 'https://jdoe.com/picture.jpg'
  }
}

export const mocks = [
  {
    request: {
      query: OidDocument,
      variables: {
        username: 'outstatic',
        repo: 'outstatic'
      }
    },
    result: {
      data: {
        repository: {
          ref: {
            target: {
              history: {
                nodes: [
                  {
                    oid: 'abcdefghijklmnopqrstuvwxyz'
                  }
                ]
              }
            }
          }
        }
      }
    }
  },
  {
    request: {
      query: DocumentDocument,
      variables: {
        owner: '',
        name: '',
        filePath: `:/metadata.json`
      },
      fetchPolicy: 'network-only'
    },
    result: {
      data: {
        repository: {
          id: '123',
          object: {
            text: JSON.stringify({
              documents: [
                {
                  publishedAt: '2022-07-14T00:00:00.000Z',
                  title: 'Example Document',
                  content: 'Example Content',
                  status: 'published',
                  slug: 'document-example'
                }
              ]
            })
          }
        }
      }
    }
  },
  {
    request: {
      query: CreateCommitDocument,
      variables: {
        input: undefined
      }
    },
    result: {
      data: {
        createCommitOnBranch: {
          commit: {
            oid: 'abcdefghijklmnopqrstuvwxyz'
          }
        }
      }
    }
  }
]

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  })

const TestReactQueryProvider = ({
  children
}: {
  children: React.ReactNode
}) => {
  const testQueryClient = createTestQueryClient()
  return (
    <QueryClientProvider client={testQueryClient}>
      {children}
    </QueryClientProvider>
  )
}

const TestDocumentContextProvider = ({
  children,
  value = {}
}: {
  children: React.ReactNode
  value?: Partial<DocumentContextType>
}) => {
  const editor = useEditor({
    extensions: [StarterKit]
  })

  const defaultValue: DocumentContextType = {
    editor: editor as Editor,
    document: documentExample,
    editDocument: () => {},
    hasChanges: false,
    setHasChanges: () => {},
    collection: 'documents',
    extension: 'md'
  }

  return (
    <DocumentContext.Provider value={{ ...defaultValue, ...value }}>
      {children}
    </DocumentContext.Provider>
  )
}

const TestFormProvider = ({ children }: { children: React.ReactNode }) => {
  const formMethods = useForm<FormData>()

  return <FormProvider {...formMethods}>{children}</FormProvider>
}

const TestNavigationGuardProvider = ({
  children
}: {
  children: React.ReactNode
}) => {
  return <NavigationGuardProvider>{children}</NavigationGuardProvider>
}

const TestSidebarProvider = ({ children }: { children: React.ReactNode }) => {
  return <SidebarProvider>{children}</SidebarProvider>
}

export const TestWrapper = (props: { children: ReactNode }) => (
  <TestProviders.ReactQuery>
    <TestProviders.DocumentContext>
      <TestProviders.Form>
        <TestSidebarProvider>{props.children}</TestSidebarProvider>
      </TestProviders.Form>
    </TestProviders.DocumentContext>
  </TestProviders.ReactQuery>
)

export const TestProviders = {
  ReactQuery: TestReactQueryProvider,
  DocumentContext: TestDocumentContextProvider,
  Form: TestFormProvider,
  NavigationGuard: TestNavigationGuardProvider,
  Sidebar: TestSidebarProvider
}
