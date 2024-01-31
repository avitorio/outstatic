import { DocumentContext } from '@/context'
import {
  CreateCommitDocument,
  DocumentDocument,
  OidDocument
} from '@/graphql/generated'
import { Document, DocumentContextType } from '@/types'
import { MockedProvider } from '@apollo/client/testing'
import { Editor, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
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

const TestApolloProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    // @ts-ignore
    <MockedProvider mocks={mocks} addTypename={false}>
      {children}
    </MockedProvider>
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
    collection: 'documents'
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

export const TestWrapper = (props: { children: ReactNode }) => (
  <TestProviders.Apollo>
    <TestProviders.DocumentContext>
      <TestProviders.Form>{props.children}</TestProviders.Form>
    </TestProviders.DocumentContext>
  </TestProviders.Apollo>
)

export const TestProviders = {
  Apollo: TestApolloProviders,
  DocumentContext: TestDocumentContextProvider,
  Form: TestFormProvider
}
