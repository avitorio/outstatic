import { useCallback, useMemo, useState } from 'react'
import { useGetConfig } from '@/utils/hooks/use-get-config'
import { useUpdateConfig } from '@/utils/hooks/use-update-config'
import { CustomFieldArrayValue } from '@/types'
import { Button } from '@/components/ui/shadcn/button'
import { Input } from '@/components/ui/shadcn/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/shadcn/dialog'
import { Skeleton } from '@/components/ui/shadcn/skeleton'
import { FolderIcon, Plus, Trash2, Settings, Info } from 'lucide-react'
import GithubExplorer from '@/components/ui/outstatic/github-explorer'
import PathBreadcrumbs from '@/components/ui/outstatic/path-breadcrumb'
import {
  DEFAULT_MEDIA_SOURCE_LABEL,
  DEFAULT_MEDIA_SOURCE_NAME,
  deriveStoredMediaExtensions,
  getFirstImageMediaSource,
  getAllowedExtensionsForSource,
  getPresetExtensionsForCategories,
  normalizeExtension
} from '@/utils/media-config'
import {
  MediaSourceConfig,
  mediaCategories,
  MediaCategory
} from '@/utils/metadata/types'
import { Label } from '@/components/ui/shadcn/label'
import { ConfigSchema } from '@/utils/schemas/config-schema'
import { useOutstatic } from '@/utils/hooks/use-outstatic'
import { CreatableMultiCombobox } from '@/components/ui/outstatic/creatable-multi-combobox'
import { slugify } from 'transliteration'

type MediaSettingsProps =
  | {
      onSettingsUpdate?: () => void
    }
  | Record<string, never>

type EditableMediaSource = MediaSourceConfig & {
  extensionsInput: string
}

type MediaSourceEditorState = {
  scope: string
  index: number
  step: number
} | null

type ScopedIndexState = {
  scope: string
  index: number
} | null

type DraftSourcesState = {
  scope: string
  sources: EditableMediaSource[]
} | null

const parseExtensionsInput = (value: string) =>
  value
    .split(/[,\n]/)
    .map((entry) => normalizeExtension(entry))
    .filter(Boolean)

const formatExtensionsInput = (extensions: readonly string[]) =>
  extensions.join(', ')

const appendExtensionsToInput = (
  currentInput: string,
  addedExtensions: readonly string[]
) => {
  const currentExtensions = parseExtensionsInput(currentInput)
  const nextExtensions = Array.from(
    new Set([...currentExtensions, ...addedExtensions.map(normalizeExtension)])
  )

  return formatExtensionsInput(nextExtensions)
}

const categoryLabel = (category: MediaCategory) =>
  category.charAt(0).toUpperCase() + category.slice(1)

const categoryOptions: CustomFieldArrayValue[] = mediaCategories.map(
  (category) => ({
    label: categoryLabel(category),
    value: category
  })
)

const getFallbackMediaSourceName = (index: number) =>
  index === 0 ? DEFAULT_MEDIA_SOURCE_NAME : `media-${index + 1}`

const inferMediaSourceName = (label: string, fallbackName: string) => {
  const normalizedLabel = label.trim()

  if (!normalizedLabel) {
    return fallbackName
  }

  return (
    slugify(normalizedLabel, { allowedChars: 'a-zA-Z0-9.' }) || fallbackName
  )
}

const createEditableMediaSource = (
  index: number,
  existing?: Partial<MediaSourceConfig>
): EditableMediaSource => {
  const fallbackName = getFallbackMediaSourceName(index)
  const fallbackLabel =
    index === 0 ? DEFAULT_MEDIA_SOURCE_LABEL : `Media ${index + 1}`
  const categoryExtensions = getPresetExtensionsForCategories(
    existing?.categories
  )
  const extensions = Array.from(
    new Set([...categoryExtensions, ...(existing?.extensions ?? [])])
  )

  return {
    name: inferMediaSourceName(
      existing?.label ?? '',
      existing?.name ?? fallbackName
    ),
    label: existing?.label ?? fallbackLabel,
    input: existing?.input ?? `media/${fallbackName}`,
    output: existing?.output ?? `/media/${fallbackName}`,
    categories: existing?.categories,
    extensions: existing?.extensions,
    extensionsInput: formatExtensionsInput(extensions),
    ...existing
  }
}

const toEditableMediaSource = (
  source: MediaSourceConfig,
  index: number
): EditableMediaSource => createEditableMediaSource(index, source)

const toMediaSourceConfig = (
  source: EditableMediaSource,
  index: number
): MediaSourceConfig => {
  const { extensionsInput, ...configFields } = source
  const { categories, extensions } = deriveStoredMediaExtensions({
    categories: source.categories,
    extensions: parseExtensionsInput(extensionsInput)
  })
  const fallbackName = getFallbackMediaSourceName(index)

  return {
    ...configFields,
    name: inferMediaSourceName(source.label, fallbackName),
    extensions: extensions?.length ? extensions : undefined,
    categories
  }
}

const formatValidationErrors = (
  issues: Array<{ path: PropertyKey[]; message: string }>
) =>
  issues.map((issue) => {
    const [, index, field] = issue.path

    if (typeof index === 'number') {
      const fieldLabel =
        typeof field === 'string'
          ? field === 'name'
            ? ' label'
            : ` ${field}`
          : ''
      return `Source ${index + 1}${fieldLabel}: ${issue.message}`
    }

    return issue.message
  })

const sourceEditorSteps = [
  {
    title: 'Label',
    description: 'Choose the source label.'
  },
  {
    title: 'Paths',
    description: 'Set the repository folder and the public path for files.'
  },
  {
    title: 'Types',
    description:
      'Select category presets and fine-tune the final extension list.'
  }
] as const

export function MediaSettings(props: MediaSettingsProps) {
  const onSettingsUpdate = props.onSettingsUpdate ?? (() => {})
  const [loading, setLoading] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingMediaSources, setPendingMediaSources] = useState<
    MediaSourceConfig[] | null
  >(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [showRepoFolderDialog, setShowRepoFolderDialog] = useState(false)
  const [repoDialogIndex, setRepoDialogIndex] = useState<number | null>(null)
  const [selectedRepoFolder, setSelectedRepoFolder] = useState('')
  const { data: config, isPending } = useGetConfig()
  const { media, repoOwner, repoSlug, repoBranch } = useOutstatic()
  const repoScopeKey = `${repoOwner}/${repoSlug}/${repoBranch}`
  const [activeEditorState, setActiveEditorState] =
    useState<MediaSourceEditorState>(null)
  const [creatingSourceState, setCreatingSourceState] =
    useState<ScopedIndexState>(null)
  const [infoDialogState, setInfoDialogState] = useState<ScopedIndexState>(null)
  const [draftSourcesState, setDraftSourcesState] =
    useState<DraftSourcesState>(null)
  const draftSources =
    draftSourcesState?.scope === repoScopeKey ? draftSourcesState.sources : null
  const activeEditor =
    activeEditorState?.scope === repoScopeKey ? activeEditorState : null
  const creatingSourceIndex =
    creatingSourceState?.scope === repoScopeKey
      ? creatingSourceState.index
      : null
  const infoDialogIndex =
    infoDialogState?.scope === repoScopeKey ? infoDialogState.index : null

  const onSubmit = useUpdateConfig({ setLoading })

  const resolveSources = useCallback(
    (current: EditableMediaSource[] | null) =>
      current ??
      (media ?? []).map((source, index) =>
        toEditableMediaSource(source, index)
      ),
    [media]
  )

  const sources = resolveSources(draftSources)

  const updateSources = (
    updater: (current: EditableMediaSource[]) => EditableMediaSource[]
  ) => {
    setDraftSourcesState((current) => ({
      scope: repoScopeKey,
      sources: updater(
        resolveSources(current?.scope === repoScopeKey ? current.sources : null)
      )
    }))
  }

  const normalizedSources = useMemo(
    () => sources.map((source, index) => toMediaSourceConfig(source, index)),
    [sources]
  )
  const legacySource = getFirstImageMediaSource(normalizedSources)
  const infoSource =
    infoDialogIndex !== null ? normalizedSources[infoDialogIndex] : undefined
  const infoSourceCategories = (infoSource?.categories ?? []).map(categoryLabel)
  const infoSourceExtensions = infoSource
    ? getAllowedExtensionsForSource(infoSource)
    : []
  const isCreatingSourceFlow =
    activeEditor !== null && creatingSourceIndex === activeEditor.index
  const visibleSourceIndexes = isCreatingSourceFlow
    ? activeEditor
      ? [activeEditor.index]
      : []
    : sources.map((_, index) => index)

  const updateSource = (
    index: number,
    updater: (current: EditableMediaSource) => EditableMediaSource
  ) => {
    updateSources((current) =>
      current.map((source, currentIndex) =>
        currentIndex === index ? updater(source) : source
      )
    )
  }

  const updateSelectedCategories = (
    index: number,
    selectedOptions: CustomFieldArrayValue[]
  ) => {
    const nextCategories = selectedOptions.map(
      (option) => option.value
    ) as MediaCategory[]

    updateSource(index, (source) => {
      const previousCategories = source.categories ?? []
      const addedCategories = nextCategories.filter(
        (category) => !previousCategories.includes(category)
      )
      const presetExtensions = getPresetExtensionsForCategories(addedCategories)

      return {
        ...source,
        categories: nextCategories,
        extensionsInput: appendExtensionsToInput(
          source.extensionsInput,
          presetExtensions
        )
      }
    })
  }

  const openSourceEditor = (index: number, step = 0) => {
    setActiveEditorState({ scope: repoScopeKey, index, step })
  }

  const closeSourceEditor = () => {
    setCreatingSourceState(null)
    setActiveEditorState(null)
  }

  const handleEditorBack = () => {
    if (!activeEditor) {
      return
    }

    if (activeEditor.step === 0) {
      if (creatingSourceIndex === activeEditor.index) {
        updateSources((current) =>
          current.filter(
            (_, currentIndex) => currentIndex !== activeEditor.index
          )
        )
      }

      setCreatingSourceState(null)
      setActiveEditorState(null)
      return
    }

    setActiveEditorState({
      ...activeEditor,
      step: activeEditor.step - 1
    })
  }

  const handleEditorNext = () => {
    setActiveEditorState((current) => {
      if (!current || current.scope !== repoScopeKey) {
        return current
      }

      if (current.step >= sourceEditorSteps.length - 1) {
        setCreatingSourceState(null)
        return null
      }

      return {
        ...current,
        step: current.step + 1
      }
    })
  }

  const removeSource = (index: number) => {
    updateSources((current) =>
      current.filter((_, currentIndex) => currentIndex !== index)
    )

    setActiveEditorState((current) => {
      if (!current || current.scope !== repoScopeKey) {
        return current
      }

      if (current.index === index) {
        return null
      }

      if (current.index > index) {
        return { ...current, index: current.index - 1 }
      }

      return current
    })

    setInfoDialogState((current) => {
      if (current === null || current.scope !== repoScopeKey) {
        return current
      }

      if (current.index === index) {
        return null
      }

      if (current.index > index) {
        return { ...current, index: current.index - 1 }
      }

      return current
    })
  }

  const handleBrowseFolder = (index: number) => {
    setRepoDialogIndex(index)
    setSelectedRepoFolder(sources[index]?.input ?? '')
    setShowRepoFolderDialog(true)
  }

  const handleSubmit = () => {
    const parsed = ConfigSchema.safeParse({
      ...(config ?? {}),
      media: normalizedSources
    })

    if (!parsed.success) {
      setValidationErrors(formatValidationErrors(parsed.error.issues))
      return
    }

    setValidationErrors([])
    setPendingMediaSources(parsed.data.media ?? [])
    setShowConfirmModal(true)
  }

  const confirmSubmit = () => {
    if (!pendingMediaSources) {
      return
    }

    setShowConfirmModal(false)
    setDraftSourcesState({
      scope: repoScopeKey,
      sources: pendingMediaSources.map((source, index) =>
        toEditableMediaSource(source, index)
      )
    })
    setValidationErrors([])
    onSubmit({
      configFields: {
        media: pendingMediaSources
      },
      callbackFunction: () => onSettingsUpdate()
    })
  }

  return (
    <>
      <div className="space-y-6">
        {!isCreatingSourceFlow && !activeEditor ? (
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold">Media Sources</h3>
              <p className="text-sm text-muted-foreground">
                Add media sources to unlock file uploads.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const nextIndex = sources.length
                updateSources((current) => [
                  ...current,
                  createEditableMediaSource(current.length, {
                    label: '',
                    name: '',
                    input: '',
                    output: ''
                  })
                ])
                setCreatingSourceState({
                  scope: repoScopeKey,
                  index: nextIndex
                })
                openSourceEditor(nextIndex)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add source
            </Button>
          </div>
        ) : null}

        {!isCreatingSourceFlow && validationErrors.length > 0 ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <p className="mb-2 font-medium">Please fix the following issues:</p>
            <ul className="space-y-1">
              {validationErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {isPending ? (
          <div className="space-y-4">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : sources.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            No media sources configured yet. Add one to start uploading media.
          </div>
        ) : (
          <div className="space-y-4">
            {visibleSourceIndexes.map((index) => {
              const source = sources[index]

              if (!source) {
                return null
              }

              const previewConfig = toMediaSourceConfig(source, index)
              const isLegacySource = legacySource?.name === previewConfig.name
              const isEditing = activeEditor?.index === index
              const currentStepIndex = isEditing ? activeEditor.step : 0
              const currentStep = sourceEditorSteps[currentStepIndex]
              const isLabelStep = currentStepIndex === 0
              const isPathsStep = currentStepIndex === 1
              const isTypesStep = currentStepIndex === 2
              const hasExtensions =
                parseExtensionsInput(source.extensionsInput).length > 0
              const canGoNext =
                (isLabelStep && source.label.trim().length > 0) ||
                (isPathsStep &&
                  source.input.trim().length > 0 &&
                  source.output.trim().length > 0) ||
                isTypesStep

              return (
                <div key={`${source.name}-${index}`} className="space-y-4">
                  {!isCreatingSourceFlow && !activeEditor ? (
                    <div className="flex items-start justify-between">
                      <div className="flex items-center justify-between gap-2 w-full rounded-xl border px-4 py-2">
                        <div>
                          <h4 className="font-medium">
                            {isCreatingSourceFlow
                              ? 'New source'
                              : source.label || previewConfig.name}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant={isEditing ? 'secondary' : 'ghost'}
                            size="icon"
                            onClick={() => openSourceEditor(index)}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setInfoDialogState({ scope: repoScopeKey, index })
                            }
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={sources.length === 1}
                            onClick={() => removeSource(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium">
                              Step {currentStepIndex + 1} of{' '}
                              {sourceEditorSteps.length}: {currentStep.title}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {currentStep.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {sourceEditorSteps.map((step, stepIndex) => (
                              <button
                                key={`${source.name}-${step.title}`}
                                type="button"
                                className={`h-2.5 w-2.5 rounded-full transition-colors ${
                                  stepIndex === currentStepIndex
                                    ? 'bg-foreground'
                                    : stepIndex < currentStepIndex
                                      ? 'bg-foreground/50'
                                      : 'bg-muted-foreground/20'
                                }`}
                                aria-label={`Go to ${step.title}`}
                                onClick={() =>
                                  setActiveEditorState({
                                    scope: repoScopeKey,
                                    index,
                                    step: stepIndex
                                  })
                                }
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {isLabelStep ? (
                        <div className="space-y-2">
                          <Label htmlFor={`media-label-${index}`}>Label</Label>
                          <Input
                            id={`media-label-${index}`}
                            value={source.label}
                            onChange={(event) =>
                              updateSource(index, (current) => ({
                                ...current,
                                label: event.target.value
                              }))
                            }
                            placeholder="Images"
                          />
                          <p className="text-sm text-muted-foreground">
                            Internal name: {previewConfig.name}
                          </p>
                        </div>
                      ) : null}

                      {isPathsStep ? (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor={`media-input-${index}`}>
                              Repository path
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                id={`media-input-${index}`}
                                value={source.input}
                                onChange={(event) =>
                                  updateSource(index, (current) => ({
                                    ...current,
                                    input: event.target.value
                                  }))
                                }
                                placeholder="media/images"
                              />
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                title="Browse repository folders"
                                onClick={() => handleBrowseFolder(index)}
                              >
                                <FolderIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`media-output-${index}`}>
                              Public path
                            </Label>
                            <Input
                              id={`media-output-${index}`}
                              value={source.output}
                              onChange={(event) =>
                                updateSource(index, (current) => ({
                                  ...current,
                                  output: event.target.value
                                }))
                              }
                              placeholder="/media/images"
                            />
                          </div>
                        </div>
                      ) : null}

                      {isTypesStep ? (
                        <div className="space-y-4">
                          <div className="space-y-3">
                            <div>
                              <Label>Categories</Label>
                              <p className="text-sm text-muted-foreground">
                                Select preset groups to append their extensions
                                to the list below.
                              </p>
                            </div>
                            <CreatableMultiCombobox
                              id={`media-categories-${index}`}
                              value={(source.categories ?? []).map(
                                (category) => ({
                                  label: categoryLabel(category),
                                  value: category
                                })
                              )}
                              options={categoryOptions}
                              placeholder="Select category presets"
                              onChange={(value) =>
                                updateSelectedCategories(index, value)
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`media-extensions-${index}`}>
                              Extensions
                            </Label>
                            <Input
                              id={`media-extensions-${index}`}
                              value={source.extensionsInput}
                              onChange={(event) =>
                                updateSource(index, (current) => ({
                                  ...current,
                                  extensionsInput: event.target.value
                                }))
                              }
                              placeholder="png, jpg, webp"
                            />
                            <p className="text-sm text-muted-foreground">
                              Edit the comma-separated extension list directly.
                              Removing a preset extension here will save the
                              exact list instead of the preset group.
                            </p>
                          </div>
                        </div>
                      ) : null}

                      <div className="flex justify-between gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleEditorBack}
                        >
                          Back
                        </Button>
                        {currentStepIndex < sourceEditorSteps.length - 1 ? (
                          <Button
                            type="button"
                            onClick={handleEditorNext}
                            disabled={!canGoNext}
                          >
                            Next
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            onClick={closeSourceEditor}
                            disabled={isCreatingSourceFlow && !hasExtensions}
                          >
                            Done
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}

        {!isCreatingSourceFlow && !activeEditor ? (
          <Button
            disabled={loading || isPending || sources.length === 0}
            type="button"
            onClick={handleSubmit}
          >
            Save Media Sources
          </Button>
        ) : null}
      </div>

      <Dialog
        open={showRepoFolderDialog}
        onOpenChange={setShowRepoFolderDialog}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Select Media Folder</DialogTitle>
            <DialogDescription>
              Choose the folder where files for this source will be stored.
            </DialogDescription>
          </DialogHeader>
          <PathBreadcrumbs
            path={selectedRepoFolder ? `/${selectedRepoFolder}/` : ''}
          />
          <GithubExplorer
            path={selectedRepoFolder}
            setPath={setSelectedRepoFolder}
            hideRoot
          />
          <div className="flex justify-end">
            <Button
              onClick={() => {
                if (repoDialogIndex === null) {
                  return
                }

                updateSource(repoDialogIndex, (current) => ({
                  ...current,
                  input: selectedRepoFolder
                }))
                setShowRepoFolderDialog(false)
              }}
              disabled={selectedRepoFolder === ''}
            >
              Select
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save media sources?</DialogTitle>
            <DialogDescription>
              Future uploads will be routed through the configured media
              sources. Legacy image paths will keep pointing to the first
              image-capable source in this list.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            {pendingMediaSources?.map((source) => (
              <div key={source.name} className="rounded-md bg-muted/50 p-3">
                <p className="font-medium">{source.label}</p>
                <p className="text-muted-foreground">
                  {source.input}
                  {' -> '}
                  {source.output}
                </p>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={confirmSubmit}>
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={infoDialogIndex !== null}
        onOpenChange={(open) => {
          if (!open) {
            setInfoDialogState(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Source Info</DialogTitle>
            <DialogDescription>
              Derived paths and file types for this media source.
            </DialogDescription>
          </DialogHeader>
          {infoSource ? (
            <div className="space-y-3 text-sm">
              <p>
                <span className="font-medium">Internal name:</span>{' '}
                {infoSource.name}
              </p>
              <p>
                <span className="font-medium">Repository:</span> github.com/
                {repoOwner}/{repoSlug}/{infoSource.input}
              </p>
              <p>
                <span className="font-medium">Public:</span> {infoSource.output}
                /example-file
              </p>
              <p>
                <span className="font-medium">Categories:</span>{' '}
                {infoSourceCategories.length > 0
                  ? infoSourceCategories.join(', ')
                  : 'None'}
              </p>
              <p>
                <span className="font-medium">Extensions:</span>{' '}
                {infoSourceExtensions.length > 0
                  ? infoSourceExtensions.join(', ')
                  : 'None'}
              </p>
              {legacySource?.name === infoSource.name ? (
                <p className="text-muted-foreground">
                  This is the first image-capable source, so legacy
                  `repoMediaPath` and `publicMediaPath` will map here.
                </p>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
