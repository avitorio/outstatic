import fs from 'fs'

export const MD_MDX_REGEXP = /\.mdx?$/i

export function readMdMdxFiles(path: string) {
  const dirents = fs.readdirSync(path, { withFileTypes: true })
  const mdMdxFiles = dirents
    .filter((dirent) => dirent.isFile() && MD_MDX_REGEXP.test(dirent.name))
    .map((dirent) => dirent.name)
  return mdMdxFiles
}
