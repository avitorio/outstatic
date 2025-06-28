import { DndContext, DragEndEvent, useDroppable } from '@dnd-kit/core'
import { restrictToParentElement } from '@dnd-kit/modifiers'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { MouseEventHandler } from 'react'
import Select, {
  CSSObjectWithLabel,
  ControlProps,
  MultiValueGenericProps,
  MultiValueProps,
  MultiValueRemoveProps,
  OnChangeValue,
  components,
  MenuProps
} from 'react-select'
import { Column } from '../DocumentsTable'

const MultiValue = (props: MultiValueProps<Column>) => {
  const onMouseDown: MouseEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }
  const innerProps = { ...props.innerProps, onMouseDown }
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: props.data.id
    })

  if (transform) {
    transform.scaleX = 1
    transform.scaleY = 1
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <div style={style} ref={setNodeRef} {...attributes} {...listeners}>
      {/* @ts-ignore */}
      <components.MultiValue {...props} innerProps={innerProps} />
    </div>
  )
}

const MultiValueLabel = (props: MultiValueGenericProps<Column>) => {
  return (
    <div className="flex cursor-pointer items-center pl-1 bg-background">
      <GripVertical size={15} />
      {/* @ts-ignore */}
      <components.MultiValueLabel
        {...props}
        innerProps={{ className: 'text-foreground' }}
      />
    </div>
  )
}

const Control = (props: ControlProps<Column>) => {
  const { setNodeRef } = useDroppable({
    id: 'droppable'
  })

  return (
    <div
      ref={setNodeRef}
      className="border border-solid border-muted rounded-md bg-background text-foreground"
    >
      {/* @ts-ignore */}
      <components.Control
        {...props}
        innerProps={{
          style: {
            backgroundColor: `hsl(var(--background))`
          }
        }}
      />
    </div>
  )
}

const MultiValueContainer = (props: MultiValueGenericProps<Column>) => {
  return (
    <div className="bg-background text-foreground border border-solid rounded-md mr-2">
      {/* @ts-ignore */}
      <components.MultiValueContainer {...props} />
    </div>
  )
}

const MultiValueRemove = (props: MultiValueRemoveProps<Column>) => {
  return (
    <div className="bg-background text-foreground">
      {/* @ts-ignore */}
      <components.MultiValueRemove
        {...props}
        innerProps={{
          onPointerDown: (e: any) => e.stopPropagation(),
          ...props.innerProps,
          className: `${props.innerProps.className} text-foreground`
        }}
      />
    </div>
  )
}

const Menu = (props: MenuProps) => {
  return (
    <>
      {/* @ts-ignore */}
      <components.Menu
        {...props}
        innerProps={{
          className:
            'rounded-md border bg-popover text-popover-foreground shadow-md outline-hidden',
          style: {
            backgroundColor: `hsl(var(--background))`,
            border: '1px solid hsl(var(--muted))',
            boxShadow:
              'var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)'
          }
        }}
      >
        {props.children}
      </components.Menu>
    </>
  )
}

const SortableSelect = ({
  selected,
  setSelected,
  defaultValues,
  allOptions,
  onChangeList,
  onBlur
}: {
  selected: Column[]
  setSelected: React.Dispatch<React.SetStateAction<Column[]>>
  defaultValues: Column[]
  allOptions: Column[]
  onChangeList: (e: any) => void
  onBlur: (e: any) => void
}) => {
  const onChange = (selectedOptions: OnChangeValue<Column, true>) => {
    setSelected([...selectedOptions])
    onChangeList(selectedOptions)
  }

  const onSortEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!active || !over) return

    setSelected((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over.id)
      const newItems = arrayMove(items, oldIndex, newIndex)

      onChangeList(newItems)

      return newItems
    })
  }

  return (
    <DndContext modifiers={[restrictToParentElement]} onDragEnd={onSortEnd}>
      <SortableContext items={selected} strategy={rectSortingStrategy}>
        <Select
          isMulti
          defaultValue={defaultValues}
          options={allOptions}
          value={selected}
          onChange={onChange}
          components={{
            // @ts-ignore We're failing to provide a required index prop to SortableElement
            MultiValue,
            MultiValueLabel,
            MultiValueContainer,
            MultiValueRemove,
            Control,
            // @ts-ignore
            Menu
          }}
          isClearable={false}
          escapeClearsValue={false}
          closeMenuOnSelect={false}
          onBlur={onBlur}
          autoFocus
          styles={{
            control: (base: any) =>
              ({
                ...base,
                border: 'none',
                boxShadow: 'none',
                '&:hover': {
                  border: 'none'
                }
              } as CSSObjectWithLabel),
            option: (base: any) =>
              ({
                ...base,
                color: 'hsl(var(--foreground))',
                backgroundColor: 'hsl(var(--background))',
                '&:hover': {
                  backgroundColor: 'hsl(var(--muted))'
                },
                border: 'none'
              } as CSSObjectWithLabel)
          }}
        />
      </SortableContext>
    </DndContext>
  )
}

export default SortableSelect
