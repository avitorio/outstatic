import {
  isValidCalendarDate,
  normalizeDateOnlyFrontmatter,
  toCalendarDate
} from './calendar-date'

describe('toCalendarDate', () => {
  it('keeps a date-only string on its intended calendar day', () => {
    const date = toCalendarDate('2024-04-07')

    expect(date.getFullYear()).toBe(2024)
    expect(date.getMonth()).toBe(3)
    expect(date.getDate()).toBe(7)
  })

  it('converts raw YAML date-only values to local calendar dates', () => {
    const data = normalizeDateOnlyFrontmatter(
      { eventDate: new Date('2024-04-07T00:00:00.000Z') },
      'eventDate: 2024-04-07\n'
    )
    const date = data.eventDate

    expect(date.getFullYear()).toBe(2024)
    expect(date.getMonth()).toBe(3)
    expect(date.getDate()).toBe(7)
  })

  it('preserves an explicit midnight-UTC timestamp', () => {
    const timestamp = new Date('2024-04-07T00:00:00.000Z')
    const date = normalizeDateOnlyFrontmatter(
      { eventDate: timestamp },
      'eventDate: 2024-04-07T00:00:00.000Z\n'
    ).eventDate

    expect(date).toBe(timestamp)
  })

  it('identifies invalid date values so form callers can leave them unset', () => {
    expect(isValidCalendarDate(toCalendarDate('not-a-date'))).toBe(false)
  })
})
