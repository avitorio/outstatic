export const getLocalDate = () => {
  const offDate = new Date().valueOf() - new Date().getTimezoneOffset() * 6000
  return new Date(offDate)
}
