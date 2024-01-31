import { Document, Session } from '@/types'
import { getLocalDate } from '@/utils/getLocalDate'
import { parseContent } from '@/utils/parseContent'
import { Editor } from '@tiptap/react'
import matter from 'gray-matter'
import { Dispatch, SetStateAction, useEffect } from 'react'
import { UseFormReturn } from 'react-hook-form'
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

      const parsedContent = parseContent(content)

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
            name: session?.user.name ?? '',
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
