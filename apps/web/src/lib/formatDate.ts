import { parseISO, format } from 'date-fns'

const formatDate = (dateString: string) => {
  const date = parseISO(dateString)
  return format(date, 'LLLL	d, yyyy')
}

export default formatDate
