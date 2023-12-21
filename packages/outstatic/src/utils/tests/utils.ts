// Transform a date into a string to avoid timezone issues when testing
export const dateToString = (date: Date) =>
  date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
