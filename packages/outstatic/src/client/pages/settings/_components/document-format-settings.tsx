import { useGetConfig } from '@/utils/hooks/use-get-config'
import { useUpdateConfig } from '@/utils/hooks/use-update-config'
import { Button } from '@/components/ui/shadcn/button'
import { Label } from '@/components/ui/shadcn/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/shadcn/select'
import { useState, useMemo } from 'react'
import { Skeleton } from '@/components/ui/shadcn/skeleton'
import { MDExtensions } from '@/utils/metadata/types'

export function DocumentFormatSettings() {
  const [loading, setLoading] = useState(false)
  const { data: config, isPending } = useGetConfig()
  const [localExtension, setLocalExtension] = useState<
    MDExtensions | 'not-set' | null
  >(null)

  const onSubmit = useUpdateConfig({ setLoading })

  // Derive selected extension from local state or config
  const selectedExtension = useMemo(() => {
    if (localExtension !== null) {
      return localExtension
    }
    return config?.mdExtension ?? 'not-set'
  }, [localExtension, config?.mdExtension])

  const hasChanges = useMemo(() => {
    if (localExtension === null) return false
    return (
      localExtension !== 'not-set' && localExtension !== config?.mdExtension
    )
  }, [localExtension, config?.mdExtension])

  const handleExtensionChange = (value: string) => {
    setLocalExtension(value as MDExtensions | 'not-set')
  }

  const handleSave = () => {
    if (selectedExtension === 'not-set') return

    onSubmit({
      configFields: { mdExtension: selectedExtension },
      callbackFunction: () => {
        setLocalExtension(null)
      }
    })
  }

  const isSaveDisabled =
    loading || selectedExtension === 'not-set' || !hasChanges

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="mdExtension">Default Document Format</Label>
        {isPending ? (
          <Skeleton className="w-full h-10" />
        ) : (
          <Select
            value={selectedExtension}
            onValueChange={handleExtensionChange}
          >
            <SelectTrigger id="mdExtension" className="w-full">
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="not-set" disabled>
                Not set
              </SelectItem>
              <SelectItem value="md">Markdown (.md)</SelectItem>
              <SelectItem value="mdx">MDX (.mdx)</SelectItem>
            </SelectContent>
          </Select>
        )}
        <p className="text-sm text-muted-foreground">
          The default file format used when creating new documents.
        </p>
      </div>
      <Button disabled={isSaveDisabled} onClick={handleSave}>
        {loading ? 'Saving...' : 'Save'}
      </Button>
    </div>
  )
}
