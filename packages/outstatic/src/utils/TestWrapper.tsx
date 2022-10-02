import { MockedProvider } from '@apollo/client/testing'
import { Editor, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { ReactNode } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { PostContext } from '../context'
import { OidDocument } from '../graphql/generated'
import { Document } from '../types'

const postExample: Document = {
  publishedAt: new Date('2022-07-14'),
  title: 'Example Post',
  content: 'Example Content',
  status: 'published',
  slug: 'post-example',
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
  }
]

export const TestWrapper = (props: { children: ReactNode }) => {
  const formMethods = useForm<FormData>()
  const editor = useEditor({
    extensions: [StarterKit]
  })

  return (
    <MockedProvider mocks={mocks} addTypename={false}>
      <PostContext.Provider
        value={{
          editor: editor as Editor,
          post: postExample,
          editPost: () => {},
          files: [],
          setFiles: () => {},
          hasChanges: false,
          collection: 'posts'
        }}
      >
        <FormProvider {...formMethods}>{props.children}</FormProvider>
      </PostContext.Provider>
    </MockedProvider>
  )
}
