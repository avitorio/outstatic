import { MockedProvider } from '@apollo/client/testing'
import { Editor, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { ReactNode } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { DocumentContext } from '../context'
import {
  OidDocument,
  DocumentDocument,
  CreateCommitDocument
} from '../graphql/generated'
import { Document } from '../types'

const documentExample: Document = {
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

const mocks = [
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

export const TestWrapper = (props: { children: ReactNode }) => {
  const formMethods = useForm<FormData>()
  const editor = useEditor({
    extensions: [StarterKit]
  })

  return (
    // @ts-ignore
    <MockedProvider mocks={mocks} addTypename={false}>
      <DocumentContext.Provider
        value={{
          editor: editor as Editor,
          document: documentExample,
          editDocument: () => {},
          files: [],
          setFiles: () => {},
          hasChanges: false,
          collection: 'documents'
        }}
      >
        <FormProvider {...formMethods}>{props.children}</FormProvider>
      </DocumentContext.Provider>
    </MockedProvider>
  )
}
