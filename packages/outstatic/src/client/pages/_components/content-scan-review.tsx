'use client'

import {
  Alert,
  AlertDescription,
  AlertTitle
} from '@/components/ui/shadcn/alert'
import { Badge } from '@/components/ui/shadcn/badge'
import { Button } from '@/components/ui/shadcn/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/shadcn/card'
import { Checkbox } from '@/components/ui/shadcn/checkbox'
import { Input } from '@/components/ui/shadcn/input'
import type { ContentScanResult, ContentSuggestion } from '@/types/content-scan'
import { useImportContent } from '@/utils/hooks/use-import-content'
import { useOutstatic } from '@/utils/hooks/use-outstatic'
import { UpgradeDialog } from '@/components/ui/outstatic/upgrade-dialog'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { type Dispatch, type SetStateAction, useMemo, useState } from 'react'
import { toast } from 'sonner'

type EditableSuggestion = ContentSuggestion & { selected: boolean }

function SuggestionRow({
  suggestion,
  onChange
}: {
  suggestion: EditableSuggestion
  onChange: (next: EditableSuggestion) => void
}) {
  return (
    <div className="flex gap-3 border-b py-4 last:border-0">
      <Checkbox
        checked={suggestion.selected}
        onCheckedChange={(checked) =>
          onChange({ ...suggestion, selected: checked === true })
        }
        aria-label={`Import ${suggestion.title}`}
      />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={suggestion.title}
            className="h-8 max-w-64"
            onChange={(event) =>
              onChange({ ...suggestion, title: event.target.value })
            }
            aria-label={`Name for ${suggestion.path}`}
          />
          <Badge variant="secondary">
            {suggestion.docCount} file{suggestion.docCount === 1 ? '' : 's'}
          </Badge>
          <span className="font-mono text-xs text-muted-foreground">
            {suggestion.path}
          </span>
        </div>
        {suggestion.fields.length ? (
          <div className="flex flex-wrap gap-1.5">
            {suggestion.fields.map((field) => (
              <Badge key={field.name} variant="outline">
                {field.title}: {field.fieldType}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            No custom frontmatter fields found.
          </p>
        )}
        {suggestion.warnings.map((warning) => (
          <p
            key={warning}
            className="text-xs text-amber-700 dark:text-amber-400"
          >
            {warning}
          </p>
        ))}
      </div>
    </div>
  )
}

export function ContentScanReview({
  scan,
  onManual
}: {
  scan: ContentScanResult
  onManual: () => void
}) {
  const {
    canSaveContent,
    isHosted,
    isPro,
    projectInfo,
    dashboardRoute,
    basePath
  } = useOutstatic()
  const router = useRouter()
  const importContent = useImportContent()
  const [collections, setCollections] = useState<EditableSuggestion[]>(() =>
    scan.suggestions.map((suggestion) => ({
      ...suggestion,
      selected: suggestion.preselected
    }))
  )
  const [singletons, setSingletons] = useState<EditableSuggestion[]>(() =>
    scan.singletons.map((suggestion) => ({ ...suggestion, selected: true }))
  )
  const [applying, setApplying] = useState(false)
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)
  const canImport = isHosted ? Boolean(canSaveContent) : isPro
  const selectedCollections = useMemo(
    () => collections.filter((item) => item.selected),
    [collections]
  )
  const selectedSingletons = useMemo(
    () => singletons.filter((item) => item.selected),
    [singletons]
  )

  const update = (
    setItems: Dispatch<SetStateAction<EditableSuggestion[]>>,
    next: EditableSuggestion
  ) =>
    setItems((items) =>
      items.map((item) => (item.id === next.id ? next : item))
    )

  const apply = async () => {
    if (applying) return
    if (!canImport) {
      setShowUpgradeDialog(true)
      return
    }
    setApplying(true)
    try {
      const result = await importContent(
        selectedCollections,
        selectedSingletons
      )
      if (!result.committed) {
        toast.info('All selected content is already configured.')
      } else {
        toast.success(
          result.skipped.length
            ? 'Content imported; existing entries were skipped.'
            : 'Dashboard content imported.'
        )
        router.push(`${basePath}${dashboardRoute}`)
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Import failed. Please try again.'
      )
    } finally {
      setApplying(false)
    }
  }

  const selectedCount = selectedCollections.length + selectedSingletons.length

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>We found content in your repository</CardTitle>
        <CardDescription>
          Review the folders below before adding them to your dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {scan.existingOutstatic &&
        !scan.existingOutstatic.matchesProjectConfig ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Existing Outstatic setup found</AlertTitle>
            <AlertDescription>
              Found Outstatic content at{' '}
              <span className="font-mono">
                {scan.existingOutstatic.contentPath}
              </span>
              . Update Repository Folder in settings to use it.
            </AlertDescription>
          </Alert>
        ) : null}
        {scan.warnings.map((warning) => (
          <p key={warning} className="text-sm text-muted-foreground">
            {warning}
          </p>
        ))}
        {collections.length ? (
          <section>
            <h2 className="mb-2 font-medium">Collections</h2>
            {collections.map((suggestion) => (
              <SuggestionRow
                key={suggestion.id}
                suggestion={suggestion}
                onChange={(next) => update(setCollections, next)}
              />
            ))}
          </section>
        ) : null}
        {singletons.length ? (
          <section>
            <h2 className="mb-2 font-medium">Standalone pages</h2>
            {singletons.map((suggestion) => (
              <SuggestionRow
                key={suggestion.id}
                suggestion={suggestion}
                onChange={(next) => update(setSingletons, next)}
              />
            ))}
          </section>
        ) : null}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button onClick={apply} disabled={applying || selectedCount === 0}>
            {applying ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Set up dashboard{selectedCount ? ` (${selectedCount})` : ''}
          </Button>
          <Button variant="ghost" onClick={onManual}>
            Set up manually
          </Button>
        </div>
      </CardContent>
      <UpgradeDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        feature="content-setup"
        accountSlug={projectInfo?.accountSlug}
        dashboardRoute={dashboardRoute}
      />
    </Card>
  )
}
