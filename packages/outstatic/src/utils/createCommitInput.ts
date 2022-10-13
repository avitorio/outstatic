import { encode } from 'js-base64'
import { FileType } from '../types'

type createCommitInputType = {
  owner: string
  slug?: string
  oldSlug?: string
  content?: string
  oid: string
  files?: FileType[]
  repoSlug: string
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

          additions.push({
            path: `${
              monorepoPath ? monorepoPath + '/' : ''
            }public/${type}/${newFilename}`,
            contents: fileContents
          })

          newContent = newContent.replace(blob, `/${type}/${newFilename}`)
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
        branchName: 'main'
      },
      message: {
        headline
      },
      fileChanges,
      expectedHeadOid: oid
    }
  }
}
