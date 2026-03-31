const extractors = {
  'github.com': /.+\/([a-f0-9]+)$/
}

export const hashFromUrl = (u: string) => {
  if (u.indexOf('github.com') >= 0) {
    return u.replace(extractors['github.com'], '$1')
  }
  return ''
}
