export const replaceImageSrcRoot = (
  html: string,
  from: string | RegExp,
  to: string
) => {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  doc.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src') || ''
    img.setAttribute('src', src.replace(from, to))
  })
  return doc.getElementsByTagName('body')[0].innerHTML
}
