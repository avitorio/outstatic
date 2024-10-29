import { Document, MDExtensions, Session } from '@/types'
import { getLocalDate } from '@/utils/getLocalDate'
import { parseContent } from '@/utils/parseContent'
import { Editor } from '@tiptap/react'
import matter from 'gray-matter'
import { Dispatch, SetStateAction, useEffect } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { useGetDocument } from './useGetDocument'
import useOutstatic from './useOutstatic'
import { useCollections } from './useCollections'

interface UseDocumentUpdateEffectProps {
  collection: string
  methods: UseFormReturn<Document, any>
  slug: string
  editor: Editor
  session: Session | null
  setHasChanges: Dispatch<SetStateAction<boolean>>
  setShowDelete: Dispatch<SetStateAction<boolean>>
  setExtension: Dispatch<SetStateAction<MDExtensions>>
  setMetadata: Dispatch<SetStateAction<Record<string, any>>>
}

export const useDocumentUpdateEffect = ({
  collection,
  methods,
  slug,
  editor,
  session,
  setHasChanges,
  setShowDelete,
  setExtension,
  setMetadata
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

  const { data: collections } = useCollections({
    enabled: slug !== 'new',
    detailed: true
  })

  const collectionPath = collections?.fullData?.find(
    (col) => col.name === collection
  )?.path

  const { data: document } = useGetDocument({
    filePath: `${
      collectionPath ? `${collectionPath}` : `${ostContent}/${collection}`
    }/${slug}`,
    enabled: slug !== 'new' && collectionPath !== undefined
  })

  useEffect(() => {
    if (document && editor) {
      const { mdDocument } = document
      const { data, content } = matter(mdDocument)
      setMetadata(data)
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
      setHasChanges(false)
    } else {
      // Set publishedAt value on slug update to avoid undefined on first render
      if (slug) {
        const formData = methods.getValues()

        methods.reset({
          ...formData,
          publishedAt: slug === 'new' ? getLocalDate() : formData.publishedAt
        })
      }
    }

    const subscription = methods.watch(() => setHasChanges(true))

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document, methods, slug, editor, session])
}
