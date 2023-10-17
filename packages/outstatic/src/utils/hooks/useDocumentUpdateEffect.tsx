import { Dispatch, SetStateAction, useEffect } from 'react'
import matter from 'gray-matter'
import { UseFormReturn } from 'react-hook-form'
import { Document, Session } from '../../types'
import { Editor } from '@tiptap/react'
import { API_IMAGES_PATH, IMAGES_PATH } from '../constants'
import { getLocalDate } from '../getLocalDate'
import useFileQuery from './useFileQuery'

interface UseDocumentUpdateEffectProps {
  collection: string
  methods: UseFormReturn<Document, any>
  slug: string
  editor: Editor
  session: Session | null
  setHasChanges: Dispatch<SetStateAction<boolean>>
  setShowDelete: Dispatch<SetStateAction<boolean>>
}

export const useDocumentUpdateEffect = ({
  collection,
  methods,
  slug,
  editor,
  session,
  setHasChanges,
  setShowDelete
}: UseDocumentUpdateEffectProps) => {
  const { data: documentQueryData } = useFileQuery({
    file: `${collection}/${slug}.md`,
    skip: slug === 'new' || !slug
  })

  useEffect(() => {
    const documentQueryObject = documentQueryData?.repository?.object

    if (documentQueryObject?.__typename === 'Blob') {
      let mdContent = documentQueryObject.text as string
      const { data, content } = matter(mdContent)

      const parseContent = () => {
        // Prepare regex
        let regex = new RegExp(
          `(\\!\\[[^\\]]*\\]\\()/${IMAGES_PATH.replace(/\//g, '\\/')}([^)]+)`,
          'g'
        )

        // Replace the path for image files in Markdown image syntax, regardless of file format
        let result = content.replace(regex, `$1${API_IMAGES_PATH}$2`)
        // fetch images from GitHub in case deploy is not done yet
        return result
      }

      const parsedContent = parseContent()

      const newDate = data.publishedAt
        ? new Date(data.publishedAt)
        : getLocalDate()
      const document = {
        ...data,
        publishedAt: newDate,
        content: parsedContent,
        slug
      }
      methods.reset(document)
      editor.commands.setContent(parsedContent)
      editor.commands.focus('start')
      setShowDelete(slug !== 'new')
    } else {
      // Set publishedAt value on slug update to avoid undefined on first render
      if (slug) {
        const formData = methods.getValues()

        methods.reset({
          ...formData,
          author: {
            name: session?.user.name,
            picture: session?.user.image ?? ''
          },
          coverImage: '',
          publishedAt: slug === 'new' ? getLocalDate() : formData.publishedAt
        })
      }
    }

    const subscription = methods.watch(() => setHasChanges(true))

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentQueryData, methods, slug, editor, session])
}
