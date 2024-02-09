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
  ControlProps,
  MultiValueGenericProps,
  MultiValueProps,
  MultiValueRemoveProps,
  OnChangeValue,
  components
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
      <components.MultiValue {...props} innerProps={innerProps} />
    </div>
  )
}

const MultiValueLabel = (props: MultiValueGenericProps<Column>) => {
  return (
    <div className="flex cursor-pointer items-center pl-1">
      <GripVertical size={15} />
      <components.MultiValueLabel {...props} />
    </div>
  )
}

const Control = (props: ControlProps<Column>) => {
  const { setNodeRef } = useDroppable({
    id: 'droppable'
  })

  return (
    <div ref={setNodeRef}>
      <components.Control {...props} />
    </div>
  )
}

const MultiValueContainer = (props: MultiValueGenericProps<Column>) => {
  return <components.MultiValueContainer {...props} />
}

const MultiValueRemove = (props: MultiValueRemoveProps<Column>) => {
  return (
    <components.MultiValueRemove
      {...props}
      innerProps={{
        onPointerDown: (e) => e.stopPropagation(),
        ...props.innerProps
      }}
    />
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
            Control
          }}
          isClearable={false}
          escapeClearsValue={false}
          closeMenuOnSelect={false}
          onBlur={onBlur}
          autoFocus
          className="border border-gray-200 rounded-md"
          styles={{
            control: (base) => ({
              ...base,
              border: 'none',
              boxShadow: 'none',
              '&:hover': {
                border: 'none'
              }
            })
          }}
        />
      </SortableContext>
    </DndContext>
  )
}

export default SortableSelect
