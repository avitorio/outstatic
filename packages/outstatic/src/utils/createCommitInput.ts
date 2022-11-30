import { encode } from 'js-base64'
import { FileType } from '../types'

type createCommitInputType = {
  message?: string
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
  collection?: string
}

export const createCommitInput = ({
  message,
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
  const additions = []
  const deletions = []
  let commitMessage = message ?? 'chore: Outstatic commit'

  if (slug && content && collection) {
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

    // change to file change commit
    commitMessage = `feat(${collection}): ${slug}`
  }

  // Remove old file if slug has changed
  if (oldSlug) {
    deletions.push({
      path: `${
        monorepoPath ? monorepoPath + '/' : ''
      }${contentPath}/${collection}/${oldSlug}.md`
    })
    // change to file delete commit
    commitMessage = `feat(${collection}): remove ${oldSlug}`
  }

  return {
    input: {
      branch: {
        repositoryNameWithOwner: `${owner}/${repoSlug}`,
        branchName: repoBranch
      },
      message: {
        headline: commitMessage
      },
      fileChanges: {
        additions,
        deletions
      },
      expectedHeadOid: oid
    }
  }
}
