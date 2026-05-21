import { useEffect, useMemo, useState } from 'react'
import { Blocks, X } from 'lucide-react'
import { DynamicIcon, type IconName } from 'lucide-react/dynamic'
import { Button } from '@/components/ui/shadcn/button'
import { Input } from '@/components/ui/shadcn/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/shadcn/popover'
import { cn } from '@/utils/ui'

type IconPickerProps = {
  value: string | undefined
  onChange: (value: string | undefined) => void
}

const POPULAR_ICONS = [
  'sparkles',
  'star',
  'heart',
  'lightbulb',
  'rocket',
  'flame',
  'zap',
  'flag',
  'bookmark',
  'tag',
  'target',
  'award',
  'gift',
  'package',
  'box',
  'pin',
  'info',
  'circle-alert',
  'circle-check',
  'triangle-alert',
  'help-circle',
  'eye',
  'bell',
  'shield',
  'lock',
  'quote',
  'code',
  'terminal',
  'file-text',
  'book',
  'book-open',
  'calendar',
  'clock',
  'map',
  'map-pin',
  'globe',
  'mail',
  'message-circle',
  'message-square',
  'user',
  'users',
  'image',
  'video',
  'music',
  'play-circle',
  'pause-circle',
  'download',
  'upload',
  'link',
  'external-link',
  'database',
  'cloud',
  'server',
  'settings',
  'square-pen',
  'arrow-right',
  'arrow-up-right',
  'trending-up',
  'bar-chart',
  'pie-chart',
  'coffee'
]

const MAX_RESULTS = 120

const TRIGGER_BUTTON_CLASSES = 'h-9 w-9'

const renderSelectedIcon = (value: string | undefined) => {
  if (!value) {
    return <Blocks className="h-4 w-4 text-muted-foreground" />
  }
  return (
    <DynamicIcon
      name={value as IconName}
      className="h-4 w-4"
      fallback={() => <Blocks className="h-4 w-4 text-muted-foreground" />}
    />
  )
}

export const IconPicker = ({ value, onChange }: IconPickerProps) => {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [allNames, setAllNames] = useState<string[] | null>(null)

  useEffect(() => {
    if (!open || allNames) return
    let cancelled = false
    import('lucide-react/dynamic').then((module) => {
      if (cancelled) return
      setAllNames(module.iconNames as unknown as string[])
    })
    return () => {
      cancelled = true
    }
  }, [open, allNames])

  useEffect(() => {
    if (!open) {
      setSearch('')
    }
  }, [open])

  const visibleIcons = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return POPULAR_ICONS
    }
    const source = allNames ?? POPULAR_ICONS
    const matches: string[] = []
    for (const name of source) {
      if (name.includes(query)) {
        matches.push(name)
        if (matches.length >= MAX_RESULTS) break
      }
    }
    return matches
  }, [search, allNames])

  const handleSelect = (iconName: string) => {
    onChange(iconName)
    setOpen(false)
  }

  const handleClear = () => {
    onChange(undefined)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={value ? `Icon: ${value}` : 'Select icon'}
          className={TRIGGER_BUTTON_CLASSES}
        >
          {renderSelectedIcon(value)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <div className="border-b p-2">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search icons..."
            className="h-9"
            autoFocus
          />
        </div>
        {value ? (
          <button
            type="button"
            onClick={handleClear}
            className="flex w-full items-center gap-2 border-b px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <X className="h-4 w-4" />
            Clear icon
          </button>
        ) : null}
        <div className="max-h-[280px] overflow-y-auto p-2">
          {visibleIcons.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              No icons match.
            </p>
          ) : (
            <div className="grid grid-cols-8 gap-1">
              {visibleIcons.map((iconName) => {
                const isSelected = iconName === value
                return (
                  <button
                    key={iconName}
                    type="button"
                    title={iconName}
                    onClick={() => handleSelect(iconName)}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
                      isSelected && 'bg-accent text-accent-foreground'
                    )}
                  >
                    <DynamicIcon
                      name={iconName as IconName}
                      className="h-4 w-4"
                      fallback={() => null}
                    />
                  </button>
                )
              })}
            </div>
          )}
          {!search.trim() ? (
            <p className="mt-2 px-2 text-xs text-muted-foreground">
              Type to search the full catalog.
            </p>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  )
}
