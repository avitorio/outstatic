import React, { MouseEventHandler } from 'react'

import Select, {
  components,
  MultiValueGenericProps,
  MultiValueProps,
  Props
} from 'react-select'
import {
  SortableContainer,
  SortableContainerProps,
  SortableElement,
  SortEndHandler,
  SortableHandle
} from 'react-sortable-hoc'
import { Column } from '../DocumentsTable'
import { GripVertical } from 'lucide-react'

function arrayMove<T>(array: readonly T[], from: number, to: number) {
  const slicedArray = array.slice()
  slicedArray.splice(
    to < 0 ? array.length + to : to,
    0,
    slicedArray.splice(from, 1)[0]
  )
  return slicedArray
}

const SortableMultiValue = SortableElement((props: MultiValueProps<Column>) => {
  const onMouseDown: MouseEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }
  const innerProps = { ...props.innerProps, onMouseDown }
  return <components.MultiValue {...props} innerProps={innerProps} />
})

const SortableMultiValueLabel = SortableHandle(
  (props: MultiValueGenericProps) => (
    <div className="flex cursor-pointer items-center pl-1">
      <GripVertical size={15} />
      <components.MultiValueLabel {...props} />
    </div>
  )
)

const SortableSelect = SortableContainer(Select) as React.ComponentClass<
  Props<Column, true> & SortableContainerProps
>

export default function MultiSelectSort({
  selected,
  defaultValues,
  allOptions,
  onChange,
  onBlur
}: {
  selected: readonly Column[]
  defaultValues: Column[]
  allOptions: Column[]
  onChange: (e: any) => void
  onBlur: (e: any) => void
}) {
  const onSortEnd: SortEndHandler = ({ oldIndex, newIndex }) => {
    const newValue = arrayMove(selected, oldIndex, newIndex)
    onChange(newValue)
  }

  return (
    <SortableSelect
      useDragHandle
      // react-sortable-hoc props:
      axis="xy"
      onSortEnd={onSortEnd}
      distance={4}
      getHelperDimensions={({ node }) => node.getBoundingClientRect()}
      // react-select props:
      isClearable={false}
      escapeClearsValue={false}
      isMulti
      defaultValue={defaultValues}
      options={allOptions}
      value={selected}
      onChange={onChange}
      components={{
        // @ts-ignore
        MultiValue: SortableMultiValue,
        // @ts-ignore
        MultiValueLabel: SortableMultiValueLabel
      }}
      closeMenuOnSelect={false}
      onBlur={onBlur}
    />
  )
}
