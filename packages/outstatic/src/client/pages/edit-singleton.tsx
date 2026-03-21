import { Document, MDExtensions } from '@/types'
import { useFileStore } from '@/utils/hooks/use-file-store'
import { useGetConfig } from '@/utils/hooks/use-get-config'
import { useGetFileByPath } from '@/utils/hooks/use-get-file-by-path'
import { useGetSingletonSchema } from '@/utils/hooks/use-get-singleton-schema'
import { useOutstatic } from '@/utils/hooks/use-outstatic'
import { useSingletonUpdateEffect } from '@/utils/hooks/use-singleton-update-effect'
import useSubmitSingleton from '@/utils/hooks/use-submit-singleton'
import { useSingletons } from '@/utils/hooks/use-singletons'
import { parseContent } from '@/utils/parse-content'
import { getLocalDate } from '@/utils/get-local-date'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import NewSingletonModal from './_components/new-singleton-modal'
import { EditorPageShell } from './_components/editor-page-shell'
import { useEditorPageState } from './_components/use-editor-page-state'
import { useSearchParams } from 'next/navigation'
import matter from 'gray-matter'
import { slugify } from 'transliteration'

export default function EditSingleton({ slug: initialSlug }: { slug: string }) {
  const [slug, setSlug] = useState(initialSlug)
  const [isNew, setIsNew] = useState(initialSlug === 'new')
  useEffect(() => {
    setIsNew(initialSlug === 'new')
  }, [initialSlug])
  const [loading, setLoading] = useState(false)
  const {
    basePath,
    session,
    hasChanges,
    setHasChanges,
    dashboardRoute,
    repoMediaPath,
    publicMediaPath,
    repoOwner,
    repoSlug,
    repoBranch
  } = useOutstatic()

  const searchParams = useSearchParams()
  const openFilePath = searchParams?.get('openFile') ?? null
  const [openFileLoaded, setOpenFileLoaded] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showSingletonModal, setShowSingletonModal] = useState(false)
  const [singletonContentPath, setSingletonContentPath] = useState<
    string | undefined
  >(undefined)
  const [showMediaPathDialog, setShowMediaPathDialog] = useState(false)
  const [showExtensionDialog, setShowExtensionDialog] = useState(false)
  const [pendingConfigMdExtension, setPendingConfigMdExtension] =
    useState<MDExtensions | null>(null)
  const [mediaPathUpdated, setMediaPathUpdated] = useState(false)

  const { data: schema } = useGetSingletonSchema({ slug, enabled: !isNew })
  const { data: config } = useGetConfig()
  const { data: singletons } = useSingletons()
  const files = useFileStore((state) => state.files)
  const {
    methods,
    editor,
    customFields,
    setCustomFields,
    extension,
    setExtension,
    metadata,
    setMetadata,
    editDocument
  } = useEditorPageState({
    schema,
    initialExtension: 'md',
    setHasChanges
  })

  const { data: openedFileData } = useGetFileByPath({
    filePath: openFilePath,
    enabled: isNew && !!openFilePath && !openFileLoaded
  })

  const singletonTitle = isNew
    ? 'New Singleton'
    : singletons?.find((singleton) => singleton.slug === slug)?.title || slug

  const onSubmit = useSubmitSingleton({
    session,
    slug,
    setSlug,
    isNew,
    setIsNew,
    setShowDelete,
    setLoading,
    files,
    customFields,
    setCustomFields,
    setHasChanges,
    editor,
    extension,
    documentMetadata: metadata,
    path: openFilePath ? undefined : singletonContentPath,
    existingFilePath: openFilePath ?? undefined
  })

  useSingletonUpdateEffect({
    slug,
    methods,
    editor,
    setHasChanges,
    setShowDelete,
    setExtension,
    setMetadata,
    enabled: !isNew && !openFilePath,
    setSingletonContentPath
  })

  useEffect(() => {
    if (!openedFileData || !editor || openFileLoaded || !openFilePath) return

    const { content: fileContent, extension: fileExtension } = openedFileData
    const { data, content } = matter(fileContent)

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

    const filename = openFilePath.substring(openFilePath.lastIndexOf('/') + 1)
    const titleFromFilename = filename.replace(/\.mdx?$/, '')
    const title = data.title || titleFromFilename
    const nextSlug = data.slug || slugify(title, { allowedChars: 'a-zA-Z0-9.' })
    const newDate = data.publishedAt
      ? new Date(data.publishedAt)
      : getLocalDate()

    const newDocument = {
      ...data,
      title,
      slug: nextSlug,
      status: data.status || 'draft',
      publishedAt: newDate,
      content: parsedContent,
      author: {
        name: data.author?.name || session?.user?.name || '',
        picture: data.author?.picture || session?.user?.image || ''
      }
    }

    setSingletonContentPath(openFilePath)
    setExtension(fileExtension)

    Promise.resolve().then(() => {
      methods.reset(newDocument)
      editor.commands.setContent(parsedContent)
      editor.commands.focus('start')
    })

    setHasChanges(true)
    setOpenFileLoaded(true)
  }, [
    openedFileData,
    editor,
    openFileLoaded,
    openFilePath,
    basePath,
    repoOwner,
    repoSlug,
    repoBranch,
    publicMediaPath,
    repoMediaPath,
    methods,
    setHasChanges,
    setMetadata,
    setExtension,
    session?.user?.image,
    session?.user?.name
  ])

  useEffect(() => {
    if (slug !== 'new' && slug !== initialSlug) {
      window.history.replaceState(
        {},
        '',
        `${basePath}${dashboardRoute}/singletons/${slug}`
      )
    }
  }, [slug, initialSlug, basePath, dashboardRoute])

  useEffect(() => {
    if (mediaPathUpdated) {
      onSubmit(methods.getValues())
    }
  }, [mediaPathUpdated, methods, onSubmit])

  useEffect(() => {
    if (singletonContentPath && isNew && !openFilePath) {
      const submitOptions = pendingConfigMdExtension
        ? {
            configUpdate: {
              mdExtension: pendingConfigMdExtension
            }
          }
        : undefined

      // @ts-ignore
      onSubmit(methods.getValues(), submitOptions)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [singletonContentPath, pendingConfigMdExtension])

  useEffect(() => {
    if (isNew && !openFilePath && config?.mdExtension) {
      setExtension(config.mdExtension)
    }
  }, [isNew, openFilePath, config?.mdExtension, setExtension])

  useEffect(() => {
    if (!isNew) {
      setPendingConfigMdExtension(null)
    }
  }, [isNew])

  const handleSave = (data: Document) => {
    if (!repoMediaPath && !publicMediaPath && files.length > 0) {
      setShowMediaPathDialog(true)
      return
    }

    if (isNew && !singletonContentPath && !openFilePath) {
      if (!config?.mdExtension && !pendingConfigMdExtension) {
        setShowExtensionDialog(true)
      } else {
        setShowSingletonModal(true)
      }
      return
    }

    if (!isNew && !config?.mdExtension) {
      // @ts-ignore
      return onSubmit(data, { configUpdate: { mdExtension: extension } })
    }

    if (isNew && openFilePath && !config?.mdExtension) {
      // @ts-ignore
      return onSubmit(data, { configUpdate: { mdExtension: extension } })
    }

    if (isNew && !openFilePath && pendingConfigMdExtension) {
      // @ts-ignore
      return onSubmit(data, {
        configUpdate: { mdExtension: pendingConfigMdExtension }
      })
    }

    // @ts-ignore
    return onSubmit(data)
  }

  const handleExtensionDialogSave = (selectedExtension: MDExtensions) => {
    setExtension(selectedExtension)
    setPendingConfigMdExtension(selectedExtension)
    setShowSingletonModal(true)
  }

  return (
    <EditorPageShell
      methods={methods}
      editor={editor}
      editDocument={editDocument}
      hasChanges={hasChanges}
      setHasChanges={setHasChanges}
      collection="_singletons"
      extension={extension}
      title={methods.getValues('title') || singletonTitle}
      settingsTitle={methods.getValues('title') || singletonTitle}
      saveDocument={methods.handleSubmit(handleSave as any, (data) => {
        console.error({ data })
        const firstKey = Object.keys(data)[0] as keyof typeof data
        const errorMessage =
          (data[firstKey] as { message?: string })?.message || 'Unknown error'
        toast.error(`Error in ${firstKey}: ${errorMessage}`)
      })}
      loading={loading}
      showDelete={showDelete}
      customFields={customFields}
      setCustomFields={setCustomFields}
      metadata={metadata}
      titlePlaceholder={`Your ${singletonTitle} title`}
      showMediaPathDialog={showMediaPathDialog}
      setShowMediaPathDialog={setShowMediaPathDialog}
      onMediaPathConfigured={() => {
        setMediaPathUpdated(true)
      }}
      showExtensionDialog={showExtensionDialog}
      setShowExtensionDialog={setShowExtensionDialog}
      extensionFileName={`${methods.getValues('slug') || 'singleton'}.${extension}`}
      onExtensionSave={handleExtensionDialogSave}
      singleton={slug}
      extraDialogs={
        <NewSingletonModal
          open={showSingletonModal}
          onOpenChange={setShowSingletonModal}
          loading={loading}
          extension={extension}
          singletonTitle={methods.getValues('title') || 'Singleton'}
          onSave={(path) => {
            setSingletonContentPath(path)
            setShowSingletonModal(false)
          }}
        />
      }
    />
  )
}
