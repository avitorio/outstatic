import { ButtonHTMLAttributes, createElement, forwardRef } from 'react'
import Datepicker, { ReactDatePickerCustomHeaderProps } from 'react-datepicker'
import { Button } from '../ui/button'

// @ts-ignore
const RDPC = (Datepicker.default ?? Datepicker) as typeof Datepicker.default

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

// get year from date
const getYear = (date: Date) => {
  return date.getFullYear()
}

// get month from date
const getMonth = (date: Date) => {
  return date.getMonth()
}

// create range array for year
const years = Array.from(
  { length: 100 },
  (_, i) => new Date().getFullYear() - i
)

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]

const DateTimePicker = ({ date, setDate, id, label }: DateTimePickerProps) => {
  const DatePickerButton = (
    props: React.DetailedHTMLProps<
      ButtonHTMLAttributes<HTMLButtonElement>,
      HTMLButtonElement
    >,
    ref: React.Ref<HTMLButtonElement>
  ) => (
    <Button {...props} ref={ref} variant="outline" disabled={!date}>
      {date ? date.toLocaleDateString('en-US', options) : 'Loading'}
    </Button>
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
        <RDPC
          name={id}
          selected={date}
          onChange={(date: Date) => {
            setDate(date)
          }}
          renderCustomHeader={({
            date,
            changeYear,
            changeMonth,
            decreaseMonth,
            increaseMonth,
            prevMonthButtonDisabled,
            nextMonthButtonDisabled
          }: ReactDatePickerCustomHeaderProps): any => (
            <div className="react-datepicker__header">
              <select
                className="react-datepicker__current-month appearance-none cursor-pointer hover:text-blue-500"
                value={getYear(date)}
                onChange={({ target: { value } }) => changeYear(Number(value))}
              >
                {years.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select
                className="react-datepicker__current-month appearance-none cursor-pointer hover:text-blue-500"
                value={months[getMonth(date)]}
                onChange={({ target: { value } }) =>
                  changeMonth(months.indexOf(value))
                }
              >
                {months.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              <button
                onClick={decreaseMonth}
                disabled={prevMonthButtonDisabled}
                type="button"
                className="react-datepicker__navigation react-datepicker__navigation--previous"
                aria-label="Previous Month"
              >
                <span className="react-datepicker__navigation-icon react-datepicker__navigation-icon--previous">
                  Previous Month
                </span>
              </button>
              <button
                onClick={increaseMonth}
                disabled={nextMonthButtonDisabled}
                type="button"
                className="react-datepicker__navigation react-datepicker__navigation--next"
                aria-label="Next Month"
              >
                <span className="react-datepicker__navigation-icon react-datepicker__navigation-icon--next">
                  Next Month
                </span>
              </button>
            </div>
          )}
          customInput={createElement(forwardRef(DatePickerButton)) as any}
          showTimeInput
          timeInputLabel="Time:"
          withPortal
          portalId="__next"
        />
      </div>
    </>
  )
}

export default DateTimePicker
