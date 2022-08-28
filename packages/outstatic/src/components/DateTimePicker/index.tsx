import { ButtonHTMLAttributes, forwardRef, createElement } from 'react'
import Datepicker from 'react-datepicker'

type DateTimePickerProps = {
  date?: Date
  setDate: (date: Date) => void
  id: string
  label?: string
}

const options = {
  year: 'numeric' as const,
  month: 'long' as const,
  day: 'numeric' as const
}

const DateTimePicker = ({ date, setDate, id, label }: DateTimePickerProps) => {
  const DatePickerButton = (
    props: React.DetailedHTMLProps<
      ButtonHTMLAttributes<HTMLButtonElement>,
      HTMLButtonElement
    >,
    ref: React.Ref<HTMLButtonElement>
  ) => (
    <button
      {...props}
      ref={ref}
      className="block cursor-pointer appearance-none rounded-lg border border-gray-300 bg-gray-50 p-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
      disabled={!date}
    >
      {date ? date.toLocaleDateString('en-US', options) : 'Loading'}
    </button>
  )

  return (
    <>
      {label && (
        <label className="block text-sm font-medium text-gray-900" htmlFor={id}>
          {label}
        </label>
      )}
      {/* The outter div serves as a referrence to positioning the DatePicker */}
      <div>
        <Datepicker
          name={id}
          selected={date}
          onChange={(date: Date) => {
            setDate(date)
          }}
          customInput={createElement(forwardRef(DatePickerButton))}
        />
      </div>
    </>
  )
}

export default DateTimePicker
