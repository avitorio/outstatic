import { Document, MDExtensions, Session } from '@/types'
import { getLocalDate } from '@/utils/getLocalDate'
import { parseContent } from '@/utils/parseContent'
import { Editor } from '@tiptap/react'
import matter from 'gray-matter'
import { Dispatch, SetStateAction, useEffect } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { useGetCollectionSchema } from './useGetCollectionSchema'
import { useGetDocument } from './useGetDocument'
import useOutstatic from './useOutstatic'

interface UseDocumentUpdateEffectProps {
  collection: string
  methods: UseFormReturn<Document, any>
  slug: string
  editor: Editor
  session: Session | null
  setHasChanges: Dispatch<SetStateAction<boolean>>
  setShowDelete: Dispatch<SetStateAction<boolean>>
  setExtension: Dispatch<SetStateAction<MDExtensions>>
}

export const useDocumentUpdateEffect = ({
  collection,
  methods,
  slug,
  editor,
  session,
  setHasChanges,
  setShowDelete,
  setExtension
}: UseDocumentUpdateEffectProps) => {
  const {
    basePath,
    ostContent,
    repoOwner,
    repoSlug,
    repoBranch,
    publicMediaPath,
    repoMediaPath
  } = useOutstatic()

  const { data: schema } = useGetCollectionSchema({ enabled: slug !== 'new' })

  const { data: document } = useGetDocument({
    filePath: `${
      schema?.path ? `${schema.path}` : `${ostContent}/${collection}`
    }/${slug}`,
    enabled: slug !== 'new' && schema !== undefined
  })

  useEffect(() => {
    if (document && editor) {
      const { mdDocument } = document
      const { data, content } = matter(mdDocument)

      const parsedContent = parseContent({
        content,
        basePath,
        repoOwner,
        repoSlug,
        repoBranch,
        publicMediaPath,
        repoMediaPath
      })

      const newDate = data.publishedAt
        ? new Date(data.publishedAt)
        : getLocalDate()
      const newDocument = {
        ...data,
        publishedAt: newDate,
        content: parsedContent,
        slug
      }
      methods.reset(newDocument)
      editor.commands.setContent(parsedContent)
      editor.commands.focus('start')
      setShowDelete(slug !== 'new')
      setExtension(document.extension)
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
  }, [document, methods, slug, editor, session])
}
