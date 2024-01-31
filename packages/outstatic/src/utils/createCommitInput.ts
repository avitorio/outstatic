import { FileType } from '@/types'
import { encode } from 'js-base64'
import { assertUnreachable } from './assertUnreachable'
import { IMAGES_PATH } from './constants'

type createCommitInputType = {
  owner: string
  slug?: string
  oldSlug?: string
  content?: string
  oid: string
  files?: FileType[]
  repoSlug: string
  repoBranch: string
  contentPath: string
  monorepoPath: string
  collection: string
}

export const createCommitInput = ({
  owner,
  slug,
  oldSlug,
  content,
  oid,
  files = [],
  repoSlug,
  repoBranch,
  contentPath,
  monorepoPath,
  collection
}: createCommitInputType) => {
  let fileChanges = {}
  const additions = []
  const deletions = []

  if (slug && content) {
    let newContent = content

    if (files.length > 0) {
      files.forEach(({ filename, blob, type, content: fileContents }) => {
        // check if blob is still in the document before adding file to the commit
        if (blob && content.search(blob) !== -1) {
          const randString = window
            .btoa(Math.random().toString())
            .substring(10, 6)
          const newFilename = filename
            .toLowerCase()
            .replace(/[^a-zA-Z0-9-_\.]/g, '-')
            .replace(/(\.[^\.]*)?$/, `-${randString}$1`)

          const filePath = (() => {
            switch (type) {
              case 'image':
                return IMAGES_PATH
              default:
                assertUnreachable(type)
            }
          })()

          additions.push({
            path: `${
              monorepoPath ? monorepoPath + '/' : ''
            }public/${filePath}${newFilename}`,
            contents: fileContents
          })

          newContent = newContent.replace(blob, `/${filePath}${newFilename}`)
        }
      })
    }

    additions.push({
      path: `${
        monorepoPath ? monorepoPath + '/' : ''
      }${contentPath}/${collection}/${slug}.md`,
      contents: encode(newContent)
    })

    fileChanges = { additions }
  }

  // Remove old file if slug has changed
  if (oldSlug) {
    deletions.push({
      path: `${
        monorepoPath ? monorepoPath + '/' : ''
      }${contentPath}/${collection}/${oldSlug}.md`
    })
    fileChanges = { ...fileChanges, deletions }
  }

  const headline = slug
    ? `feat(${collection}): ${slug}`
    : `feat(${collection}): remove ${oldSlug}`

  return {
    input: {
      branch: {
        repositoryNameWithOwner: `${owner}/${repoSlug}`,
        branchName: repoBranch
      },
      message: {
        headline
      },
      fileChanges,
      expectedHeadOid: oid
    }
  }
}
