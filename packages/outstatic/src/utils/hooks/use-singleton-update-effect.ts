import { Document, MDExtensions } from '@/types'
import { getLocalDate } from '@/utils/get-local-date'
import { parseContent } from '@/utils/parse-content'
import { Editor } from '@tiptap/react'
import matter from 'gray-matter'
import { Dispatch, SetStateAction, useEffect, useRef } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { useGetSingleton } from './use-get-singleton'
import { useOutstatic } from './use-outstatic'
import { useSingletons } from './use-singletons'

interface UseSingletonUpdateEffectProps {
  slug: string
  methods: UseFormReturn<Document, any, any>
  editor: Editor | null
  setHasChanges: Dispatch<SetStateAction<boolean>>
  setShowDelete: Dispatch<SetStateAction<boolean>>
  setExtension: Dispatch<SetStateAction<MDExtensions>>
  setMetadata: Dispatch<SetStateAction<Record<string, any>>>
  enabled?: boolean
  setSingletonContentPath: Dispatch<SetStateAction<string | undefined>>
}

export const useSingletonUpdateEffect = ({
  slug,
  methods,
  editor,
  setHasChanges,
  setShowDelete,
  setExtension,
  setMetadata,
  enabled = true,
  setSingletonContentPath
}: UseSingletonUpdateEffectProps) => {
  const {
    basePath,
    repoOwner,
    repoSlug,
    repoBranch,
    media,
    publicMediaPath,
    repoMediaPath
  } = useOutstatic()

  const parsedContentRef = useRef(false)
  const { data: singletons } = useSingletons()

  const { data: document } = useGetSingleton({
    slug,
    enabled: enabled && !!slug && slug !== 'new'
  })

  // Initialize publishedAt for new singletons
  useEffect(() => {
    if (!enabled && slug === 'new') {
      const formData = methods.getValues()
      if (!formData.publishedAt) {
        methods.reset({
          ...formData,
          publishedAt: getLocalDate()
        })
      }
    }
  }, [enabled, slug, methods])

  useEffect(() => {
    if (!enabled || parsedContentRef.current) return

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
        media,
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

      const singleton = singletons?.find((s) => s.slug === slug)
      if (singleton) {
        setSingletonContentPath(singleton.directory)
      }

      Promise.resolve().then(() => {
        methods.reset(newDocument)
        editor.commands.setContent(parsedContent)
        editor.commands.focus('start')
      })

      setShowDelete(true)
      setExtension(document.extension)
      setHasChanges(false)
      parsedContentRef.current = true
    } else {
      // Set publishedAt value on slug update to avoid undefined on first render
      if (slug) {
        const formData = methods.getValues()

        methods.reset({
          ...formData,
          publishedAt: formData.publishedAt || getLocalDate()
        })
      }
    }

    const subscription = methods.watch((_, { name }) => {
      if (name === 'content') {
        setHasChanges(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [
    basePath,
    document,
    editor,
    enabled,
    media,
    methods,
    publicMediaPath,
    repoBranch,
    repoMediaPath,
    repoOwner,
    repoSlug,
    setExtension,
    setHasChanges,
    setMetadata,
    setShowDelete,
    setSingletonContentPath,
    singletons,
    slug
  ])
}
