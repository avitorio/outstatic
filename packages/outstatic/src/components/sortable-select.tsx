'use client'

import type { DragEndEvent } from '@dnd-kit/core'
import { DndContext } from '@dnd-kit/core'
import { restrictToParentElement } from '@dnd-kit/modifiers'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Check, GripVertical, Search, X } from 'lucide-react'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type FocusEvent,
  type KeyboardEvent,
  type SetStateAction
} from 'react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList
} from '@/components/ui/shadcn/command'
import { cn } from '@/utils/ui'

export type SortableSelectOption = {
  id: string
  label: string
  value: string
}

const normalize = (value: string) => value.trim().toLowerCase()

export const reorderSortableOptions = (
  items: SortableSelectOption[],
  activeId: string,
  overId?: string
) => {
  if (!overId || activeId === overId) {
    return items
  }

  const oldIndex = items.findIndex((item) => item.id === activeId)
  const newIndex = items.findIndex((item) => item.id === overId)

  if (oldIndex === -1 || newIndex === -1) {
    return items
  }

  return arrayMove(items, oldIndex, newIndex)
}

const SortableChip = ({
  option,
  onRemove
}: {
  option: SortableSelectOption
  onRemove: (option: SortableSelectOption) => void
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: option.id
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'inline-flex items-center gap-1 rounded-sm border bg-secondary px-2 py-1 text-xs text-secondary-foreground',
        isDragging && 'z-10 shadow-md'
      )}
    >
      <button
        type="button"
        className="cursor-grab rounded-sm p-0.5 text-muted-foreground hover:text-foreground active:cursor-grabbing"
        aria-label={`Reorder ${option.label}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-3" />
      </button>
      <span>{option.label}</span>
      <button
        type="button"
        className="rounded-sm p-0.5 hover:bg-background/80"
        aria-label={`Remove ${option.label}`}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          onRemove(option)
        }}
      >
        <X className="size-3" />
      </button>
    </div>
  )
}

export const SortableSelect = ({
  selected,
  setSelected,
  allOptions,
  onChangeList,
  onBlur
}: {
  selected: SortableSelectOption[]
  setSelected: Dispatch<SetStateAction<SortableSelectOption[]>>
  allOptions: SortableSelectOption[]
  onChangeList: (items: SortableSelectOption[]) => void
  onBlur: () => void
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const selectedIds = useMemo(
    () => new Set(selected.map((option) => option.id)),
    [selected]
  )

  const filteredOptions = useMemo(() => {
    const normalizedQuery = normalize(query)

    if (!normalizedQuery) {
      return allOptions
    }

    return allOptions.filter((option) =>
      [option.label, option.value].some((value) =>
        normalize(value).includes(normalizedQuery)
      )
    )
  }, [allOptions, query])

  const updateSelected = (nextSelected: SortableSelectOption[]) => {
    setSelected(nextSelected)
    onChangeList(nextSelected)
  }

  const focusInput = () => {
    inputRef.current?.focus()
  }

  const removeOption = (option: SortableSelectOption) => {
    updateSelected(
      selected.filter((selectedOption) => selectedOption.id !== option.id)
    )
    focusInput()
  }

  const toggleOption = (option: SortableSelectOption) => {
    const nextSelected = selectedIds.has(option.id)
      ? selected.filter((selectedOption) => selectedOption.id !== option.id)
      : [...selected, option]

    updateSelected(nextSelected)
    setQuery('')
    focusInput()
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    const nextSelected = reorderSortableOptions(
      selected,
      String(active.id),
      over ? String(over.id) : undefined
    )

    if (nextSelected !== selected) {
      updateSelected(nextSelected)
    }
  }

  const handleContainerBlur = (event: FocusEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget as Node | null

    if (!event.currentTarget.contains(nextTarget)) {
      onBlur()
    }
  }

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (
      event.key === 'Backspace' &&
      query.length === 0 &&
      selected.length > 0
    ) {
      removeOption(selected[selected.length - 1])
      return
    }

    if (event.key === 'Escape') {
      onBlur()
    }
  }

  return (
    <div
      className="w-80 rounded-md border bg-popover text-popover-foreground shadow-md"
      onBlur={handleContainerBlur}
    >
      <div className="border-b p-2">
        <DndContext
          modifiers={[restrictToParentElement]}
          onDragEnd={handleDragEnd}
        >
          <div
            className="flex min-h-9 flex-wrap items-center gap-1 rounded-md border border-input bg-background px-2 py-1.5 shadow-sm"
            onClick={focusInput}
          >
            <SortableContext
              items={selected.map((option) => option.id)}
              strategy={rectSortingStrategy}
            >
              {selected.map((option) => (
                <SortableChip
                  key={option.id}
                  option={option}
                  onRemove={removeOption}
                />
              ))}
            </SortableContext>
            <div className="flex min-w-[8rem] flex-1 items-center gap-2 px-1">
              <Search className="size-4 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                className="min-w-0 flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground"
                placeholder="Filter columns"
                aria-label="Filter columns"
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={handleInputKeyDown}
              />
            </div>
          </div>
        </DndContext>
      </div>
      <Command shouldFilter={false}>
        <CommandList className="max-h-56">
          {filteredOptions.length > 0 ? (
            <CommandGroup>
              {filteredOptions.map((option) => {
                const isSelected = selectedIds.has(option.id)

                return (
                  <CommandItem
                    key={option.id}
                    value={`${option.label} ${option.value}`}
                    onMouseDown={(event) => event.preventDefault()}
                    onSelect={() => toggleOption(option)}
                  >
                    <Check
                      className={cn(
                        'size-4',
                        isSelected ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span className="truncate">{option.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          ) : (
            <CommandEmpty>No columns found.</CommandEmpty>
          )}
        </CommandList>
      </Command>
    </div>
  )
}
